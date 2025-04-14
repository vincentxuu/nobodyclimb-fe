export interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
  image: string;
  location?: string;
}

export const articles: Article[] = [
  {
    id: 1,
    title: "確保器介紹",
    category: "裝備介紹",
    date: "2022.08.29",
    description: "用於上攀確保、垂降。常見確保器有豬鼻子(ATC)、八字環(figure 8)、GriGri。安全確保使確保者用之來連接攀登繩，以增加摩擦力達到制動目的的方式來確保攀登者安全。",
    image: "/photo/blog-left.jpeg"
  },
  {
    id: 2,
    title: "壯壯",
    category: "人物誌",
    date: "2022.08.29",
    description: "攀岩初期雖然擁有滿腔的熱血，但因為念書與當兵的關係，期間曾經中斷了長達四年的時間沒有爬岩，沒有持續攀岩一氣呵成地將攀登能力的層級推高，回想起來覺得很可惜。直到2005年回台北工作後才開始重新回岩牆的懷抱。",
    image: "/photo/personmid.jpeg"
  },
  {
    id: 3,
    title: "市民抱石攀岩館 Civic Bouldergym Taipei",
    category: "岩場介紹",
    date: "2022.08.29",
    description: "近百條路線，難度橫跨 VB-V8+，不論初學者或老手都能享受適合自己的路線。獨家特色是中島型攀岩塔，以 360 度環繞讓攀登充滿變化和挑戰性，曾經魔王級的高難度路線，也經過調整而親和許多。",
    image: "/photo/climbspot-photo.jpeg",
    location: "台北市 內湖區"
  },
  {
    id: 4,
    title: "初次攀岩就上手攀岩新手應該知道的三項基礎技巧",
    category: "專欄文章",
    date: "2022.08.29",
    description: "攀岩對於初學者來說可能會感到害怕和困難，但掌握基本技巧後，就能享受攀岩的樂趣。本文將介紹三個最重要的基礎技巧：1. 正確的抓握方式 2. 重心轉移 3. 腳步技巧，幫助你開始攀岩之旅。",
    image: "/photo/blog-right.jpeg"
  },
  {
    id: 5,
    title: "如何選擇適合自己的攀岩鞋",
    category: "裝備介紹",
    date: "2022.08.29",
    description: "攀岩鞋是攀岩最重要的裝備之一，一雙合適的攀岩鞋不僅能提升攀爬表現，還能讓你更舒適地享受攀岩。本文將從鞋型、大小、材質等方面詳細介紹如何挑選適合自己的攀岩鞋。",
    image: "/photo/blog-mid-right.jpeg"
  },
  {
    id: 6,
    title: "自然岩場安全須知",
    category: "專欄文章",
    date: "2022.08.29",
    description: "在自然岩場攀岩比室內岩館更具挑戰性，同時也需要注意更多安全事項。本文將介紹戶外攀岩的必備知識，包括天氣評估、裝備檢查、確保技術等重要安全須知。",
    image: "/photo/cont-photo-mid-right.jpeg"
  },
  {
    id: 7,
    title: "POGO Climbing",
    category: "岩場介紹",
    date: "2022.08.29",
    description: "POGO擁有寬敞的空間和多樣化的路線，是台北市內最受歡迎的抱石場之一。場地內設有初階到高階的抱石牆，另外還有訓練區和休息區，適合不同程度的攀岩者使用。",
    image: "/photo/cont-photo-top-right.jpeg",
    location: "台北市 大安區"
  },
  {
    id: 8,
    title: "明明",
    category: "人物誌",
    date: "2022.08.29",
    description: "從小就喜歡運動的明明，在大學時期接觸到攀岩後就深深著迷。經過多年的練習和參與比賽，她不僅在國內比賽中獲得好成績，更代表台灣參加國際賽事。她分享：「攀岩教會我永不放棄的精神。」",
    image: "/photo/personright.jpeg"
  },
  {
    id: 9,
    title: "運動攀登比賽規則解析",
    category: "專欄文章",
    date: "2022.08.29",
    description: "想要參加攀岩比賽卻對規則感到困惑？本文將詳細介紹運動攀登比賽的各項規則，包括難度賽、速度賽和抱石賽的評分標準和比賽流程，讓你對賽事有更深入的了解。",
    image: "/photo/cont-photo-bottom-right.jpeg"
  },
  {
    id: 10,
    title: "RedRock Climbing Gym",
    category: "岩場介紹",
    date: "2022.08.29",
    description: "RedRock是台中地區最大的室內攀岩館，擁有完整的抱石和上攀設施。場地內不只有各種難度的路線，還提供專業的教練課程，是學習攀岩的理想場所。",
    image: "/photo/cont-photo-bottom-left.jpeg",
    location: "台中市 西屯區"
  }
];