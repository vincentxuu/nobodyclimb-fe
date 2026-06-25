import type { AIDocument, AIDocumentMetadata } from '../../../types'
import type { PipelineContext, PipelineStep } from '../types'

type StyleTag = '順風格' | '反風格' | '中性'

const POWER_KEYWORDS = new Set([
  'overhang',
  'roof',
  'dynamic',
  'power',
  '懸岩',
  '天花板',
  '動態',
  '力量',
  '屋簷',
  '倒掛',
])
const TECHNIQUE_KEYWORDS = new Set([
  'slab',
  'vertical',
  'technique',
  'balance',
  '薄面',
  '垂直',
  '技巧',
  '平衡',
  '摩擦',
])

function computeStyleSignal(doc: AIDocument): number {
  const text = (doc.text ?? '').toLowerCase()
  let meta: AIDocumentMetadata | null = null
  try {
    if (doc.metadata) meta = JSON.parse(doc.metadata) as AIDocumentMetadata
  } catch {
    /* ignore */
  }
  const tags = ((meta as Record<string, unknown>)?.tags as string) ?? ''
  const combined = `${text} ${tags}`
  let powerScore = 0
  let techScore = 0
  for (const kw of POWER_KEYWORDS) {
    if (combined.includes(kw)) powerScore++
  }
  for (const kw of TECHNIQUE_KEYWORDS) {
    if (combined.includes(kw)) techScore++
  }
  const total = powerScore + techScore
  if (total === 0) return 0.5
  return powerScore / total
}

function computeStyleMatch(styleSignal: number, bodyAxis: 'P' | 'T'): number {
  return bodyAxis === 'P' ? styleSignal : 1 - styleSignal
}

function computeStyleTag(styleMatch: number): StyleTag {
  if (styleMatch >= 0.6) return '順風格'
  if (styleMatch <= 0.4) return '反風格'
  return '中性'
}

export const personalityRerankStep: PipelineStep = {
  id: 'personality-rerank',
  name: '人格風格加權排序',
  description: '根據用戶攀岩人格類型調整路線分數，混合順風格與反風格',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 10.5,
  requires: ['rerankedMatches', 'documents'],
  provides: [],
  skipWhen: [
    {
      field: 'queryType',
      operator: 'in',
      value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'],
    },
  ],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    if (ctx.skipPostRetrieval) return ctx
    const personalityType = ctx.personalityType
    if (!personalityType) return ctx
    const bodyAxis = personalityType[0]
    if (bodyAxis !== 'P' && bodyAxis !== 'T') return ctx
    const { pipelineConfig, trace } = ctx
    const weight = pipelineConfig.personality_weight
    if (weight === 0) return ctx
    const mode = pipelineConfig.personality_mode
    const antiRatio = pipelineConfig.personality_anti_ratio
    const documents = ctx.documents ?? new Map()
    const rerankedMatches = ctx.rerankedMatches ?? []

    const result = rerankedMatches.map((match) => {
      const doc = documents.get(match.id)
      if (!doc || doc.type !== 'route') return match
      const styleSignal = computeStyleSignal(doc)
      const styleMatch = computeStyleMatch(styleSignal, bodyAxis as 'P' | 'T')
      let pScore: number
      if (mode === 'anti_style') {
        pScore = (1 - styleMatch) * 0.7 + styleMatch * 0.3
      } else {
        pScore = styleMatch * (1 - antiRatio) + (1 - styleMatch) * antiRatio
      }
      const finalScore = match.finalScore * (1 - weight) + pScore * weight
      const styleTag = computeStyleTag(styleMatch)
      return { ...match, finalScore, styleTag }
    })

    result.sort((a, b) => b.finalScore - a.finalScore)
    ctx.rerankedMatches = result

    // Inject [反風格] tags into context for LLM
    if (ctx.context) {
      const antiMarkers: Array<{ sourceId: string; title: string }> = []
      for (const m of result) {
        if ((m as Record<string, unknown>).styleTag === '反風格') {
          const doc = documents.get(m.id)
          if (doc) {
            const titleMatch = doc.text?.match(/路線名稱：(.+)/)
            antiMarkers.push({
              sourceId: doc.source_id,
              title: titleMatch?.[1]?.trim() ?? '',
            })
          }
        }
      }
      if (antiMarkers.length > 0) {
        const sections = ctx.context.split('\n\n---\n\n')
        ctx.context = sections
          .map((section) => {
            if (!section.includes('路線名稱：')) return section
            for (const { sourceId, title } of antiMarkers) {
              if (section.includes(sourceId) || (title && section.includes(title))) {
                return `[反風格] ${section}`
              }
            }
            return section
          })
          .join('\n\n---\n\n')
      }
    }

    trace.personality_rerank = {
      personality_type: personalityType,
      body_axis: bodyAxis,
      mode,
      weight,
      anti_ratio: antiRatio,
      doc_count: result.length,
      top_results: result.slice(0, 10).map((m) => ({
        id: m.id,
        finalScore: Math.round(m.finalScore * 1000) / 1000,
        styleTag: (m as Record<string, unknown>).styleTag ?? '中性',
      })),
    }
    return ctx
  },
}
