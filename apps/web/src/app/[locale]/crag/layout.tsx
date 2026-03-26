import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

// 台灣主要攀岩岩場 ItemList JSON-LD - 幫助搜尋引擎呈現豐富搜尋結果
const cragItemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: '台灣戶外攀岩岩場',
  description: '台灣主要戶外攀岩地點，包含龍洞、墾丁、關子嶺、德芙蘭等熱門岩場',
  url: `${SITE_URL}/crag`,
  numberOfItems: 5,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: '龍洞',
      url: `${SITE_URL}/crag/longdong`,
      description: '台灣最大天然岩場，超過 600 條攀岩路線，位於新北市貢寮區',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: '墾丁',
      url: `${SITE_URL}/crag/kenting`,
      description: '南台灣代表性珊瑚礁石灰岩運動攀登岩場，位於屏東縣恆春鎮',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: '關子嶺',
      url: `${SITE_URL}/crag/guanziling`,
      description: '台南知名石灰岩攀岩場地，以獨特泥漿溫泉和優質岩壁聞名',
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: '德芙蘭',
      url: `${SITE_URL}/crag/defulan`,
      description: '台中和平區石英質砂岩岩場，混合運動攀登與傳統攀登路線',
    },
    {
      '@type': 'ListItem',
      position: 5,
      name: '大砲岩',
      url: `${SITE_URL}/crag/shoushan`,
      description: '高雄壽山天然岩場，適合初學者體驗戶外攀岩',
    },
  ],
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CragPage')

  return {
    title: t('title'),
    description: t('layoutDescription'),
    keywords: [
      '台灣岩場',
      '戶外攀岩',
      '攀岩',
      '龍洞攀岩',
      '龍洞',
      '墾丁攀岩',
      '墾丁',
      '關子嶺攀岩',
      '關子嶺',
      '德芙蘭攀岩',
      '德芙蘭',
      '大砲岩',
      '攀岩地點',
      '運動攀登',
      '傳統攀登',
      '台灣攀岩路線',
    ],
    openGraph: {
      title: t('layoutOgTitle'),
      description: t('layoutOgDescription'),
      type: 'website',
      url: `${SITE_URL}/crag`,
      siteName: SITE_NAME,
    },
    alternates: {
      canonical: `${SITE_URL}/crag`,
    },
  }
}

export default function CragLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cragItemListJsonLd) }}
      />
      {children}
    </>
  )
}
