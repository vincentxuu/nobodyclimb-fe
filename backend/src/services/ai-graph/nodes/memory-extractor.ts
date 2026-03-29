import { extractMemoriesFromQuery } from '../../memory-extractor'
import { GraphState } from '../state'

/**
 * 記憶體萃取 node — 非阻塞設計
 *
 * 利用 waitUntilCtx.waitUntil() 將記憶體萃取排入背景執行，
 * 立即回傳空物件讓 graph 繼續到 END，不等待萃取完成。
 */
export async function memoryExtractorNode(state: GraphState): Promise<Partial<GraphState>> {
  // 非阻塞：排入 waitUntil 背景執行，立即 return
  if (state.waitUntilCtx && state.userId && state.request.query) {
    const gatewayOpts = state.env.AI_GATEWAY_SLUG
      ? { gateway: { id: state.env.AI_GATEWAY_SLUG } }
      : undefined

    state.waitUntilCtx.waitUntil(
      extractMemoriesFromQuery(
        state.request.query,
        state.userId,
        state.env.DB,
        state.env.AI,
        gatewayOpts
      )
    )
  }

  return {} // graph 立即繼續到 END，不等待記憶體萃取完成
}
