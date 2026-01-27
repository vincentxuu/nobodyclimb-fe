import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/constants'

export const runtime = 'edge'
export const alt = '人物誌'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Cloudflare KV 類型定義
interface KVNamespace {
  get(_key: string, _type: 'json'): Promise<unknown>
}

interface BiographyMetadata {
  id: string
  name: string
  avatar_url?: string | null
  bio?: string | null
  title?: string | null
  climbing_meaning?: string | null
}

async function getBiographyFromKV(slug: string): Promise<BiographyMetadata | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()
    const cache = (env as unknown as Record<string, KVNamespace | undefined>)?.CACHE

    if (!cache) return null

    const cacheKey = `bio-meta:${slug}`
    const cached = await cache.get(cacheKey, 'json')
    return cached as BiographyMetadata | null
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const person = await getBiographyFromKV(slug)

  const name = person?.name || '攀岩人物'
  const title = person?.title || ''
  const description = person?.climbing_meaning?.substring(0, 80) || person?.bio?.substring(0, 80) || ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1B1A1A',
          backgroundImage: 'linear-gradient(135deg, #1B1A1A 0%, #2a2a2a 50%, #1B1A1A 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 頂部裝飾線 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #D4A574, #E8C9A0, #D4A574)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#D4A574',
            }}
          >
            {SITE_NAME}
          </span>
        </div>

        {/* 主要內容 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 80px',
          }}
        >
          {/* 名字 */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {name}
          </h1>

          {/* 標題 */}
          {title && (
            <p
              style={{
                fontSize: '32px',
                color: '#D4A574',
                marginBottom: '24px',
              }}
            >
              {title}
            </p>
          )}

          {/* 描述 */}
          {description && (
            <p
              style={{
                fontSize: '24px',
                color: '#9CA3AF',
                maxWidth: '800px',
                lineHeight: 1.5,
              }}
            >
              {description}{description.length >= 80 ? '...' : ''}
            </p>
          )}
        </div>

        {/* 標籤 */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              color: '#6B7280',
            }}
          >
            攀岩人物誌
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
