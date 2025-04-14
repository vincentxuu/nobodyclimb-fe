export type ArticleCategory = '所有文章' | '裝備介紹' | '技巧介紹' | '技術研究' | '比賽介紹';

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  date: string;
  content: string;
  imageUrl: string;
  isFeature?: boolean;
  description?: string;
  equipment?: {
    name: string;
    usage: string;
    commonTypes: string;
    purchaseInfo: string;
    recommendation: string;
  };
  images?: string[];
}

export const mockArticles: Article[] = [
  {
    id: '1',
    title: '初次攀岩就上手，攀岩新手應該知道的基礎技巧',
    category: '技巧介紹',
    date: '2022. 08. 29',
    content: '攀岩對於初學者來說可能會感到有些挑戰性，但只要掌握正確的基礎技巧，就能夠安全且有效地開始這項運動。本文將介紹三個最重要的基礎技巧：正確的抓點方式、身體重心的運用，以及腳步的放置技巧。這些技巧不僅能幫助你更好地攀爬，還能預防受傷。',
    imageUrl: '/photo/blog-left.jpeg',
    isFeature: true,
    description: '攀岩是一項充滿挑戰和樂趣的運動，本文將為初學者介紹最基本且重要的三個技巧，幫助你開始攀岩之旅。',
    images: [
      '/photo/blog-left.jpeg',
      '/photo/blog-mid-left.jpeg',
      '/photo/blog-mid-right.jpeg',
      '/photo/blog-right.jpeg'
    ]
  },
  {
    id: '2',
    title: '攀岩確保器完整介紹：新手必讀指南',
    category: '裝備介紹',
    date: '2022. 09. 15',
    content: '確保器是攀岩安全系統中最重要的裝備之一。本文詳細介紹各種確保器的特點和使用方法，包括傳統的豬鼻子(ATC)、八字環(Figure 8)，以及自動制動確保器如 GriGri。我們將討論每種確保器的優缺點，並提供選購建議。',
    imageUrl: '/photo/blog-mid-left.jpeg',
    isFeature: true,
    description: '確保器是攀岩中最重要的安全裝備之一，本文將詳細介紹各種確保器的特點和使用方法。',
    equipment: {
      name: '確保器',
      usage: '用於上攀確保、垂降。常見確保器有豬鼻子(ATC)、八字環(figure 8)、GriGri。安全確保使確保者用之來連接攀登繩，以增加摩擦力達到制動目的的方式來確保攀登者安全。',
      commonTypes: '而常見的自動制停確保器grigri，有分為不同制動手的版本，如果是右手為制動手則放鬆凸輪用的把手在左邊，左手則反之。但繩索必須正確的置於grigri之中才有制動效果，在下降時按壓把手的力道也要掌握得宜，以及依舊不能放開制動端的繩索。許多新手會認為使用grigri更加安全，但卻因為沒有正確使用或是鬆懈而導致發生意外。',
      purchaseInfo: '掏出一些新台幣。',
      recommendation: '常見確保器有豬鼻子(ATC)、八字環(figure 8)、GriGri。安全確保使確保者用之來連接攀登繩，以增加摩擦力達到制動目的的方式來確保攀登者安全。'
    },
    images: [
      '/photo/blog-mid-left.jpeg',
      '/photo/blog-mid-right.jpeg',
      '/photo/blog-right.jpeg',
      '/photo/cont-photo-bottom-left.jpeg'
    ]
  },
  {
    id: '3',
    title: '2023 台灣攀岩公開賽賽事回顧',
    category: '比賽介紹',
    date: '2023. 12. 10',
    content: '2023年台灣攀岩公開賽已圓滿落幕，本次比賽雲集了來自全台各地的優秀選手，展現出令人驚豔的攀岩技巧。比賽分為抱石和運動攀登兩個項目，經過兩天的激烈競爭，最終由來自台北的選手奪得冠軍。',
    imageUrl: '/photo/blog-mid-right.jpeg',
    isFeature: true
  },
  {
    id: '4',
    title: '進階攀岩技術：動態移動要領解析',
    category: '技術研究',
    date: '2023. 11. 05',
    content: '動態移動是進階攀岩技巧中最具挑戰性的項目之一。本文將深入分析動態移動的力學原理、時機掌握，以及如何通過訓練來提升這項技能。我們也會分享一些常見的動態移動失誤和解決方案。',
    imageUrl: '/photo/blog-right.jpeg',
    isFeature: true
  },
  {
    id: '5',
    title: '攀岩鞋的選擇與保養：從入門到專業',
    category: '裝備介紹',
    date: '2023. 10. 20',
    content: '一雙合適的攀岩鞋對於攀岩表現至關重要。本文將指導您如何根據自己的腳型、攀岩風格和經驗水平選擇適合的攀岩鞋。同時也會分享攀岩鞋的保養方法，讓您的裝備能夠持久耐用。',
    imageUrl: '/photo/cont-photo-bottom-left.jpeg'
  },
  {
    id: '6',
    title: '抱石技巧：解決常見卡點問題',
    category: '技巧介紹',
    date: '2023. 09. 25',
    content: '在抱石過程中，攀岩者常常會遇到一些特定的難點。本文將分析幾個最常見的卡點類型，並提供具體的解決方案。從腳步調整到重心轉移，讓您能夠更順利地完成抱石路線。',
    imageUrl: '/photo/cont-photo-bottom-right.jpeg'
  },
  {
    id: '7',
    title: '2024 巴黎奧運攀岩項目預覽',
    category: '比賽介紹',
    date: '2024. 01. 15',
    content: '2024年巴黎奧運會將首次將速度攀岩作為獨立項目，與難度攀岩和抱石分開進行。本文將介紹各個項目的規則變化、參賽選手資格，以及台灣選手的備戰情況。',
    imageUrl: '/photo/cont-photo-mid-left.jpeg'
  },
  {
    id: '8',
    title: '繩索系統的力學分析',
    category: '技術研究',
    date: '2023. 12. 28',
    content: '本文將從物理學角度分析攀岩過程中繩索系統的受力情況。包括制動力的產生原理、確保點的受力分析，以及如何通過正確的技術來減少繩索系統的磨損。',
    imageUrl: '/photo/cont-photo-mid-right.jpeg'
  },
  {
    id: '9',
    title: '進階確保技術：多組距確保法詳解',
    category: '技術研究',
    date: '2023. 11. 30',
    content: '多組距攀登需要特殊的確保技術。本文將詳細介紹多組距確保的方法，包括確保站的建立、繩索的處理方式，以及如何進行組距轉換。這些技術對於戶外多組距攀登至關重要。',
    imageUrl: '/photo/cont-photo-top-left.jpeg'
  },
  {
    id: '10',
    title: '攀岩安全帽選購指南',
    category: '裝備介紹',
    date: '2023. 10. 05',
    content: '安全帽是戶外攀岩的必備裝備。本文將介紹不同類型安全帽的特點、各大品牌的產品比較，以及如何選擇適合自己的安全帽。同時也會說明安全帽的正確使用方法和保養技巧。',
    imageUrl: '/photo/cont-photo-top-right.jpeg'
  },
  {
    id: '11',
    title: '2023 亞洲攀岩錦標賽精彩回顧',
    category: '比賽介紹',
    date: '2023. 11. 20',
    content: '2023年亞洲攀岩錦標賽匯集了亞洲各地的頂尖選手，展現出精彩的競技場面。本文將回顧比賽的精彩時刻，分析各國選手的表現特點，並探討亞洲攀岩運動的發展趨勢。',
    imageUrl: '/photo/personleft.jpeg'
  },
  {
    id: '12',
    title: '室內攀岩與戶外攀岩的技巧差異',
    category: '技巧介紹',
    date: '2023. 12. 05',
    content: '很多攀岩者在從室內轉戰戶外時會遇到適應問題。本文將分析室內和戶外攀岩在技巧運用上的主要差異，包括抓點判斷、路線閱讀，以及風險管理等方面，幫助攀岩者順利過渡。',
    imageUrl: '/photo/personright.jpeg'
  }
];