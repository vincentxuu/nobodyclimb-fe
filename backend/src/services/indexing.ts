import { Env, AIDocument, AIDocumentMetadata, Route, Crag } from '../types';
import { EmbeddingService } from './embedding';
import { CONTEXTUAL_CHUNK_PROMPT } from '../utils/ai-prompts';

const CONTEXT_GENERATION_BATCH_SIZE = 5; // 並行 LLM 呼叫上限，避免超出 Workers AI 速率限制

const VECTORIZE_UPSERT_BATCH_SIZE = 1000;
const VECTORIZE_DELETE_BATCH_SIZE = 100; // Vectorize deleteByIds 上限

interface RouteWithCrag extends Route {
  crag_name: string | null;
  region: string | null;
  area_id: string | null;
  area_name: string | null;
}

interface IndexResult {
  indexed: number;
  failed: number;
}

export class IndexingService {
  private embeddingService: EmbeddingService;

  constructor(private env: Env) {
    this.embeddingService = new EmbeddingService(env);
  }

  // 將 YDS 等級轉換為數值，用於範圍過濾
  // 5.10a → 100, 5.10b → 101, ..., 5.14d → 143
  gradeToNumeric(grade: string | null): number {
    if (!grade) return 0;
    const match = grade.match(/5\.(\d+)([a-d])?/);
    if (!match) return 0;
    const base = parseInt(match[1], 10) * 10;
    const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
    return base + suffix;
  }

  private static readonly ROUTE_TYPE_LABELS: Record<string, string> = {
    sport: '運攀',
    trad: '傳攀',
    boulder: '抱石',
    mixed: '混合',
  };

  // 建立路線文件文字
  createRouteDocument(route: RouteWithCrag): string {
    // 無中文名稱時使用英文名稱作為路線名
    const displayName = route.name || route.name_en || '未知';
    const routeTypeLabel = IndexingService.ROUTE_TYPE_LABELS[route.route_type] ?? route.route_type ?? '未知';
    const parts = [
      `路線名稱：${displayName}`,
      `所屬岩場：${route.crag_name ?? '未知'}`,
      `難度等級：${route.grade ?? '未知'}`,
      `攀登類型：${routeTypeLabel}`,
      `地區：${route.region ?? '未知'}`,
    ];

    if (route.name_en && route.name_en !== route.name) {
      parts.push(`英文名稱：${route.name_en}`);
    }
    if (route.area_name) {
      parts.push(`岩場區域：${route.area_name}`);
    }
    if (route.description) {
      parts.push(`路線描述：${route.description}`);
    }
    if (route.first_ascent) {
      parts.push(`首攀：${route.first_ascent}`);
    }
    if (route.height) {
      parts.push(`路線長度：${route.height} 公尺`);
    }

    return parts.join('\n');
  }

  // 建立岩場文件文字（actualRouteCount 為從 routes 表即時計算的路線數）
  createCragDocument(crag: Crag, actualRouteCount?: number, areaNames?: string): string {
    const parts = [
      `岩場名稱：${crag.name}`,
      `地區：${crag.region ?? '未知'}`,
      `岩石類型：${crag.rock_type ?? '未知'}`,
      `路線數量：${actualRouteCount ?? crag.route_count} 條`,
    ];

    if (areaNames) {
      parts.push(`岩場內的區域（area，非獨立岩場）：${areaNames}`);
    }

    if (crag.description) {
      parts.push(`岩場描述：${crag.description}`);
    }
    if (crag.climbing_types) {
      try {
        const types = JSON.parse(crag.climbing_types) as string[];
        parts.push(`攀登類型：${types.join('、')}`);
      } catch {
        parts.push(`攀登類型：${crag.climbing_types}`);
      }
    }
    if (crag.best_seasons) {
      parts.push(`最佳季節：${crag.best_seasons}`);
    }
    if (crag.difficulty_range) {
      parts.push(`難度範圍：${crag.difficulty_range}`);
    }
    if (crag.access_info) {
      parts.push(`交通資訊：${crag.access_info}`);
    }

    return parts.join('\n');
  }

  // 索引路線，支援分頁避免 Worker timeout
  async indexRoutes(offset = 0, limit = 100): Promise<IndexResult & { hasMore: boolean }> {
    const routes = await this.env.DB.prepare(`
      SELECT r.*, c.name as crag_name, c.region, a.id as area_id, a.name as area_name
      FROM routes r
      LEFT JOIN crags c ON r.crag_id = c.id
      LEFT JOIN areas a ON r.area_id = a.id
      ORDER BY r.id
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<RouteWithCrag>();

    const totalRow = await this.env.DB.prepare(
      'SELECT COUNT(*) as count FROM routes'
    ).first<{ count: number }>();
    const total = totalRow?.count ?? 0;

    if (!routes.results.length) {
      return { indexed: 0, failed: 0, hasMore: false };
    }

    const documents = routes.results.map((route) => {
      const metadata: AIDocumentMetadata = {
        name: route.name || route.name_en || undefined,
        name_en: route.name_en ?? undefined,
        grade: route.grade ?? undefined,
        grade_numeric: this.gradeToNumeric(route.grade),
        route_type: route.route_type,
        crag_id: route.crag_id ?? undefined,
        crag_name: route.crag_name ?? undefined,
        region: route.region ?? undefined,
        area_id: route.area_id ?? undefined,
        area_name: route.area_name ?? undefined,
      };

      return {
        sourceId: route.id,
        text: this.createRouteDocument(route),
        metadata,
      };
    });

    const result = await this.indexDocuments('route', documents);
    return { ...result, hasMore: offset + routes.results.length < total };
  }

  // 索引所有岩場
  async indexCrags(): Promise<IndexResult> {
    // 預先取得每個岩場的區域列表
    const areasResult = await this.env.DB.prepare(
      `SELECT crag_id, GROUP_CONCAT(name, '、') as area_names FROM areas WHERE name IS NOT NULL GROUP BY crag_id`
    ).all<{ crag_id: string; area_names: string }>();
    const areasByCrag = new Map(areasResult.results.map((r) => [r.crag_id, r.area_names]));

    // 同時 JOIN routes 取得真實路線數，避免 description 欄位有舊的靜態數字
    const crags = await this.env.DB.prepare(`
      SELECT c.*, COUNT(r.id) as actual_route_count
      FROM crags c
      LEFT JOIN routes r ON r.crag_id = c.id
      GROUP BY c.id
    `).all<Crag & { actual_route_count: number }>();

    if (!crags.results.length) {
      return { indexed: 0, failed: 0 };
    }

    const documents = crags.results.map((crag) => {
      let climbingTypes: string[] | undefined;
      if (crag.climbing_types) {
        try {
          climbingTypes = JSON.parse(crag.climbing_types) as string[];
        } catch {
          climbingTypes = [crag.climbing_types];
        }
      }

      const metadata: AIDocumentMetadata = {
        name: crag.name,
        region: crag.region ?? undefined,
        climbing_types: climbingTypes,
        crag_id: crag.id,
      };

      return {
        sourceId: crag.id,
        text: this.createCragDocument(crag, crag.actual_route_count, areasByCrag.get(crag.id)),
        metadata,
      };
    });

    return this.indexDocuments('crag', documents);
  }

  // 重建索引，支援分頁（避免 Worker timeout）
  async reindexAll(
    type: 'route' | 'crag' | 'all' = 'all',
    offset = 0,
    limit = 100
  ): Promise<IndexResult & { hasMore: boolean; nextOffset: number }> {
    let totalIndexed = 0;
    let totalFailed = 0;
    let hasMore = false;
    let nextOffset = 0;

    if (type === 'crag' || type === 'all') {
      if (offset === 0) await this.clearType('crag');
      const result = await this.indexCrags();
      totalIndexed += result.indexed;
      totalFailed += result.failed;
    }

    if (type === 'route' || type === 'all') {
      if (offset === 0) await this.clearType('route');
      const result = await this.indexRoutes(offset, limit);
      totalIndexed += result.indexed;
      totalFailed += result.failed;
      hasMore = result.hasMore;
      nextOffset = offset + limit;
    }

    return { indexed: totalIndexed, failed: totalFailed, hasMore, nextOffset };
  }

  // 刪除某類型的現有文件
  private async clearType(type: 'route' | 'crag' | 'video'): Promise<void> {
    const existing = await this.env.DB.prepare(
      'SELECT embedding_id FROM ai_documents WHERE type = ? AND embedding_id IS NOT NULL'
    )
      .bind(type)
      .all<{ embedding_id: string }>();

    const ids = existing.results.map((r) => r.embedding_id);
    if (ids.length > 0) {
      // 分批刪除 Vectorize 向量（每批最多 100 筆）
      for (let i = 0; i < ids.length; i += VECTORIZE_DELETE_BATCH_SIZE) {
        await this.env.VECTOR_INDEX.deleteByIds(ids.slice(i, i + VECTORIZE_DELETE_BATCH_SIZE));
      }
    }

    await this.env.DB.prepare('DELETE FROM ai_documents WHERE type = ?').bind(type).run();
  }

  private async getContextualModel(): Promise<string> {
    const row = await this.env.DB.prepare(
      `SELECT value FROM ai_config WHERE key = 'contextual_rag_model'`
    ).first<{ value: string }>();
    return row?.value ?? '@cf/meta/llama-3.1-8b-instruct';
  }

  // 為單一 chunk 呼叫 LLM 生成語意摘要（失敗時回傳空字串，讓主流程 fallback 到原始文字）
  private async generateContextSummary(text: string, type: 'route' | 'crag' | 'video', model: string): Promise<string> {
    const typeLabel = type === 'route' ? '攀岩路線' : type === 'crag' ? '岩場' : '攀岩影片';
    const prompt = CONTEXTUAL_CHUNK_PROMPT
      .replace('{type}', typeLabel)
      .replace('{content}', text);
    try {
      const result = await (this.env.AI.run as Function)(model, {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80,
      });
      return (result as { response?: string }).response?.trim() ?? '';
    } catch {
      return '';
    }
  }

  // 批次生成 context summaries（每批 CONTEXT_GENERATION_BATCH_SIZE 筆並行）
  private async generateContextSummaries(
    documents: Array<{ text: string }>,
    type: 'route' | 'crag' | 'video',
    model: string
  ): Promise<string[]> {
    const summaries: string[] = new Array(documents.length).fill('');
    for (let i = 0; i < documents.length; i += CONTEXT_GENERATION_BATCH_SIZE) {
      const batch = documents.slice(i, i + CONTEXT_GENERATION_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((doc) => this.generateContextSummary(doc.text, type, model))
      );
      results.forEach((result, j) => {
        summaries[i + j] = result.status === 'fulfilled' ? result.value : '';
      });
    }
    return summaries;
  }

  // 執行文件索引：生成 embedding → 寫入 Vectorize + D1
  // Contextual RAG：embed 時 prepend LLM 生成的語意摘要，提升向量搜尋準確度
  //   - embeddingText = summary + "\n\n" + originalText（向量用）
  //   - D1 仍存 originalText（LLM 回答時的 context 保持乾淨）
  private async indexDocuments(
    type: 'route' | 'crag' | 'video',
    documents: Array<{ sourceId: string; text: string; metadata: AIDocumentMetadata }>
  ): Promise<IndexResult> {
    let indexed = 0;
    let failed = 0;

    // 為每個 chunk 生成語意摘要並 prepend 到 embedding 文字（Contextual RAG）
    const model = await this.getContextualModel();
    const summaries = await this.generateContextSummaries(documents, type, model);
    const embeddingTexts = documents.map((d, i) =>
      summaries[i] ? `${summaries[i]}\n\n${d.text}` : d.text
    );

    const embeddings = await this.embeddingService.embedBatch(embeddingTexts);

    const vectors: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }> = [];
    const dbInserts: Array<{ id: string; sourceId: string; text: string; metadata: string; embeddingId: string }> = [];

    for (let i = 0; i < documents.length; i++) {
      const embedding = embeddings[i];
      if (!embedding || embedding.length === 0) {
        failed++;
        continue;
      }

      const docId = `${type}-${documents[i].sourceId}`;

      vectors.push({
        id: docId,
        values: embedding,
        metadata: {
          type,
          ...documents[i].metadata,
        },
      });

      dbInserts.push({
        id: docId,
        sourceId: documents[i].sourceId,
        text: documents[i].text,
        metadata: JSON.stringify(documents[i].metadata),
        embeddingId: docId,
      });
    }

    // 分批寫入 Vectorize
    for (let i = 0; i < vectors.length; i += VECTORIZE_UPSERT_BATCH_SIZE) {
      try {
        await this.env.VECTOR_INDEX.upsert(vectors.slice(i, i + VECTORIZE_UPSERT_BATCH_SIZE));
      } catch (error) {
        console.error(`Vectorize upsert failed at batch ${i}:`, error);
        failed += Math.min(VECTORIZE_UPSERT_BATCH_SIZE, vectors.length - i);
        continue;
      }
    }

    // 批次寫入 D1
    for (const doc of dbInserts) {
      try {
        await this.env.DB.prepare(`
          INSERT OR REPLACE INTO ai_documents (id, type, source_id, text, metadata, embedding_id, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `)
          .bind(doc.id, type, doc.sourceId, doc.text, doc.metadata, doc.embeddingId)
          .run();
        indexed++;
      } catch (error) {
        console.error(`D1 insert failed for ${doc.id}:`, error);
        failed++;
      }
    }

    return { indexed, failed };
  }
}
