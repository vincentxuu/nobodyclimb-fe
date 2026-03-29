import { Env } from '../types'

const DEFAULT_EMBEDDING_MODEL = '@cf/baai/bge-m3'
const BATCH_SIZE = 100

interface EmbeddingResponse {
  shape: number[]
  data: number[][]
}

export class EmbeddingService {
  constructor(private env: Env) {}

  // 從 ai_config 讀取 embedding 模型名稱，fallback 到預設值
  private async getModel(): Promise<string> {
    const row = await this.env.DB.prepare(
      `SELECT value FROM ai_config WHERE key = 'embedding_model'`
    ).first<{ value: string }>()
    return row?.value ?? DEFAULT_EMBEDDING_MODEL
  }

  private gatewayOptions() {
    if (!this.env.AI_GATEWAY_SLUG) return undefined
    return { gateway: { id: this.env.AI_GATEWAY_SLUG } }
  }

  // 單一文字轉向量
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Embedding input text cannot be empty')
    }

    const model = await this.getModel()

    try {
      const response = (await this.env.AI.run(
        model as Parameters<typeof this.env.AI.run>[0],
        { text: [text.trim()] },
        this.gatewayOptions()
      )) as EmbeddingResponse

      if (!response?.data?.[0]) {
        throw new Error('Invalid embedding response from Workers AI')
      }

      return response.data[0]
    } catch (error) {
      if (error instanceof Error && error.message.includes('cannot be empty')) {
        throw error
      }
      throw new Error(
        `Workers AI embedding failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // 批次文字轉向量，自動分批（每批最多 100 個）
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []

    const results: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE).map((t) => t.trim())

      try {
        const model = await this.getModel()
        const response = (await this.env.AI.run(
          model as Parameters<typeof this.env.AI.run>[0],
          { text: batch },
          this.gatewayOptions()
        )) as EmbeddingResponse

        if (!response?.data) {
          throw new Error('Invalid batch embedding response from Workers AI')
        }

        results.push(...response.data)
      } catch (error) {
        console.error(`Embedding batch [${i}–${i + batch.length - 1}] failed:`, error)
        // 批次失敗時填入空向量佔位，讓後續批次繼續執行
        for (let j = 0; j < batch.length; j++) {
          results.push([])
        }
      }
    }

    return results
  }
}
