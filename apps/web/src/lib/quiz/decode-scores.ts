export interface DecodedScores {
  bodyPercent: number
  motivePercent: number
  mindPercent: number
  gritIndex: number
  flowIndex: number
}

export function decodeScores(s: string | null | undefined): DecodedScores | null {
  if (!s) return null
  try {
    // URL-safe base64 → standard base64
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    const json = atob(b64)
    const data = JSON.parse(json) as { b?: number; m?: number; d?: number; g?: number }
    if (
      typeof data.b !== 'number' ||
      typeof data.m !== 'number' ||
      typeof data.d !== 'number' ||
      typeof data.g !== 'number'
    ) {
      return null
    }
    return {
      bodyPercent: data.b,
      motivePercent: data.m,
      mindPercent: data.d,
      gritIndex: data.g,
      flowIndex: 100 - data.g,
    }
  } catch {
    return null
  }
}
