/**
 * Expo Push API 發送工具
 *
 * 透過 Expo Push Service (https://exp.host/--/api/v2/push/send) 發送原生推播。
 * 不依賴 expo-server-sdk，直接用 fetch 以相容 Cloudflare Workers。
 */

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send'

// Expo Push API 單次請求上限為 100 則
const BATCH_SIZE = 100

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

export interface ExpoPushResult {
  /** 成功發送的 token 數 */
  sentCount: number
  /** 已失效、應從 DB 移除的 token */
  invalidTokens: string[]
}

/**
 * 批次發送 Expo 推播通知
 *
 * 發送失敗不會 throw（推播屬 best-effort），回傳結果供呼叫端清理失效 token。
 */
export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<ExpoPushResult> {
  const result: ExpoPushResult = { sentCount: 0, invalidTokens: [] }
  if (tokens.length === 0) return result

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE)
    const messages = batch.map((to) => ({
      to,
      title,
      body,
      sound: 'default' as const,
      ...(data ? { data } : {}),
    }))

    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      })

      if (!response.ok) {
        console.error(`Expo push request failed with status ${response.status}`)
        continue
      }

      const json = (await response.json()) as { data?: ExpoPushTicket[] }
      const tickets = json.data ?? []

      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'ok') {
          result.sentCount++
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          result.invalidTokens.push(batch[idx])
        }
      })
    } catch (err) {
      console.error('Expo push request error:', err)
    }
  }

  return result
}
