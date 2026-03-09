// RAG 工具註冊機制：統一管理工具 metadata，支援動態 prompt 生成

export interface ToolParameter {
  name: string;
  description: string;
  required: boolean;
  enum?: string[];
}

export interface RAGToolDefinition {
  name: string;
  displayName: string;
  description: string;
  triggerSignals: string[];
  parameters: ToolParameter[];
  queryType: string;
  llmModel: 'main' | 'lightweight';
}

class ToolRegistry {
  private tools = new Map<string, RAGToolDefinition>();

  register(tool: RAGToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): RAGToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): RAGToolDefinition[] {
    return [...this.tools.values()];
  }

  getValidToolNames(): string[] {
    return [...this.tools.keys()];
  }

  /**
   * 動態生成 TOOL_SELECTION_PROMPT 的工具描述區塊。
   * 僅生成工具列表描述，不含規則邏輯和模板變數（{crags} 等）。
   */
  generatePromptBlock(): string {
    const tools = this.getAll();
    return tools.map((t) => {
      const params = t.parameters.map((p) => {
        const enumStr = p.enum ? `（只能填 ${p.enum.join('/')}）` : '';
        return `${p.name}${enumStr}`;
      });
      const paramsStr = params.length > 0 ? `\n  可用參數：${params.join(', ')}` : '';
      const signalsStr = t.triggerSignals.length > 0
        ? `\n  信號詞：「${t.triggerSignals.join('」「')}」`
        : '';
      return `- ${t.name}：${t.description}${paramsStr}${signalsStr}`;
    }).join('\n');
  }
}

// 建立全域 registry 並註冊現有 5 個工具
const registry = new ToolRegistry();

registry.register({
  name: 'search_routes',
  displayName: '路線語義搜尋',
  description: '搜尋攀岩路線（語義搜尋，適合開放性問題）',
  triggerSignals: [],
  parameters: [
    { name: 'crag_name', description: '岩場名稱', required: false },
    { name: 'area_name', description: '岩場區域名稱', required: false },
    { name: 'grade', description: '難度，如 "5.11b" 或 "5.10-5.12"', required: false },
    { name: 'route_type', description: '路線類型', required: false, enum: ['sport', 'trad', 'boulder', 'mixed'] },
    { name: 'region', description: '地區', required: false },
  ],
  queryType: 'simple',
  llmModel: 'main',
});

registry.register({
  name: 'search_crags',
  displayName: '岩場資訊搜尋',
  description: '搜尋岩場資訊（包含岩場特性、交通、注意事項等）',
  triggerSignals: [],
  parameters: [
    { name: 'crag_name', description: '岩場名稱', required: false },
    { name: 'region', description: '地區', required: false },
    { name: 'climbing_type', description: '攀登類型', required: false },
  ],
  queryType: 'simple',
  llmModel: 'main',
});

registry.register({
  name: 'general_knowledge',
  displayName: '一般攀岩知識',
  description: '只用於回答與特定岩場無關的一般攀岩知識（如裝備選購、基礎技術、訓練方法）',
  triggerSignals: [],
  parameters: [],
  queryType: 'general-knowledge',
  llmModel: 'lightweight',
});

registry.register({
  name: 'search_sql',
  displayName: 'SQL 精確查詢',
  description: '精確計數/統計/篩選/資料查詢（如「有幾條」「列出」「幾顆bolt」「FA是誰」「最多」「各難度」「我完攀了幾條」「我有幾條rp」）',
  triggerSignals: ['有幾條', '幾條路線', '有哪些路線', '路線有哪些', '列出', '幾顆bolt', 'FA是誰', '首攀', '哪個岩場最多', '各難度分佈', '有哪些影片', '我完攀了', '我有幾條rp', '我爬過', '我最高', '我評了幾星'],
  parameters: [
    { name: 'crag_name', description: '岩場名稱', required: false },
    { name: 'grade', description: '難度', required: false },
    { name: 'route_type', description: '路線類型', required: false, enum: ['sport', 'trad', 'boulder', 'mixed'] },
    { name: 'route_name', description: '路線名稱', required: false },
    { name: 'region', description: '地區', required: false },
  ],
  queryType: 'sql',
  llmModel: 'lightweight',
});

registry.register({
  name: 'hybrid',
  displayName: '混合推薦查詢',
  description: '推薦型查詢，需要 SQL 候選集 + LLM 推薦（如「推薦我幾條龍洞的初級路線」「推薦適合入門的路線」，且有指定岩場或具體條件）',
  triggerSignals: ['推薦', '建議'],
  parameters: [
    { name: 'crag_name', description: '岩場名稱', required: false },
    { name: 'grade', description: '難度', required: false },
    { name: 'route_type', description: '路線類型', required: false, enum: ['sport', 'trad', 'boulder', 'mixed'] },
    { name: 'region', description: '地區', required: false },
  ],
  queryType: 'hybrid',
  llmModel: 'main',
});

registry.register({
  name: 'multi_tool',
  displayName: '多工具組合查詢',
  description: '同時涉及兩種以上不同需求的複合查詢（如同時需要統計數據和語義推薦、同時查詢路線資訊和岩場資訊），與 hybrid 的區別：hybrid 是「SQL篩選+LLM推薦」固定組合，multi_tool 是任意工具的自由組合',
  triggerSignals: ['同時', '另外也', '順便', '以及', '還有...也'],
  parameters: [],
  queryType: 'multi-tool',
  llmModel: 'main',
});

export { ToolRegistry };
export default registry;
