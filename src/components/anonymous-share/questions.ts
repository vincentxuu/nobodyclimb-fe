// 問題定義和類型

export interface Question {
  id: string
  title: string
  subtitle?: string
  placeholder: string
  type: 'core_story' | 'one_liner' | 'story'
  category?: string
  categoryName?: string
}

export interface StoryInput {
  question_id: string
  content: string
  type: 'core_story' | 'one_liner' | 'story'
  question_text?: string
  category_id?: string
}

// 核心故事（3 題）
export const CORE_STORIES: Question[] = [
  {
    id: 'climbing_origin',
    title: '你與攀岩的相遇',
    subtitle: '什麼契機讓你開始攀岩？',
    placeholder: '分享你開始攀岩的故事...',
    type: 'core_story',
  },
  {
    id: 'climbing_meaning',
    title: '攀岩對你來說是什麼',
    subtitle: '攀岩在你生活中扮演什麼角色？',
    placeholder: '可能是一種運動、冥想、社交方式...',
    type: 'core_story',
  },
  {
    id: 'advice_to_self',
    title: '給剛開始攀岩的自己',
    subtitle: '如果能對過去的自己說一句話',
    placeholder: '關於技術、心態、或攀岩旅程中學到的事...',
    type: 'core_story',
  },
]

// 一句話（7 題）
export const ONE_LINERS: Question[] = [
  { id: 'best_moment', title: '爬岩最爽的是?', placeholder: '終於送出卡了一個月的 project', type: 'one_liner' },
  { id: 'favorite_place', title: '最喜歡在哪裡爬?', placeholder: '龍洞的海邊岩壁', type: 'one_liner' },
  { id: 'current_goal', title: '目前的攀岩小目標?', placeholder: '這個月送出 V4', type: 'one_liner' },
  { id: 'climbing_takeaway', title: '攀岩教會我的一件事?', placeholder: '失敗沒什麼,再來就好', type: 'one_liner' },
  { id: 'climbing_style_desc', title: '用一句話形容你的攀岩風格?', placeholder: '慢慢來但很穩', type: 'one_liner' },
  { id: 'life_outside', title: '攀岩之外,你是誰?', placeholder: '工程師/學生/全職岩棍', type: 'one_liner' },
  { id: 'bucket_list', title: '攀岩人生清單上有什麼?', placeholder: '去優勝美地爬一次', type: 'one_liner' },
]

// 深度故事（精選 12 題，涵蓋各類別）
export const STORIES: Question[] = [
  { id: 'memorable_moment', title: '有沒有某次攀爬讓你一直記到現在?', subtitle: '不一定要多厲害,只要對你有意義', placeholder: '去年第一次去龍洞...', type: 'story', category: 'sys_cat_growth', categoryName: '成長與突破' },
  { id: 'biggest_challenge', title: '有遇過什麼卡關的時候嗎?', subtitle: '卡關也是成長的一部分', placeholder: '有一段時間怎麼爬都沒進步...', type: 'story', category: 'sys_cat_growth', categoryName: '成長與突破' },
  { id: 'fear_management', title: '會怕高或怕墜落嗎?怎麼面對的?', subtitle: '每個人都有害怕的時候', placeholder: '剛開始真的很怕...', type: 'story', category: 'sys_cat_psychology', categoryName: '心理與哲學' },
  { id: 'climbing_lesson', title: '攀岩有沒有讓你學到什麼?', subtitle: '可能是對生活的啟發', placeholder: '學會了面對失敗...', type: 'story', category: 'sys_cat_psychology', categoryName: '心理與哲學' },
  { id: 'climbing_mentor', title: '有沒有想感謝的人?', subtitle: '可能是教你的人、一起爬的朋友', placeholder: '很感謝第一個帶我去爬的朋友...', type: 'story', category: 'sys_cat_community', categoryName: '社群與連結' },
  { id: 'funny_moment', title: '有沒有什麼搞笑或尷尬的經歷?', subtitle: '爬岩的糗事也很有趣', placeholder: '有一次在岩館...', type: 'story', category: 'sys_cat_community', categoryName: '社群與連結' },
  { id: 'injury_recovery', title: '有受過傷嗎?怎麼復原的?', subtitle: '分享你的經驗', placeholder: '有一次 A2 滑輪受傷...', type: 'story', category: 'sys_cat_practical', categoryName: '實用分享' },
  { id: 'technique_tip', title: '有沒有學到什麼實用的技巧?', subtitle: '可能是某個動作或心法', placeholder: '學會 heel hook 之後...', type: 'story', category: 'sys_cat_practical', categoryName: '實用分享' },
  { id: 'dream_climb', title: '如果能去任何地方爬,你想去哪?', subtitle: '你的夢想攀岩地點', placeholder: '想去優勝美地爬 El Cap...', type: 'story', category: 'sys_cat_dreams', categoryName: '夢想與探索' },
  { id: 'climbing_trip', title: '有沒有印象深刻的攀岩旅行?', subtitle: '分享你的旅行故事', placeholder: '去泰國的喀比爬了一週...', type: 'story', category: 'sys_cat_dreams', categoryName: '夢想與探索' },
  { id: 'first_outdoor', title: '還記得第一次戶外攀岩嗎?', subtitle: '室內和戶外的差別', placeholder: '第一次站在真的岩壁前...', type: 'story', category: 'sys_cat_growth', categoryName: '成長與突破' },
  { id: 'unexpected_gain', title: '攀岩有帶給你什麼意外的收穫嗎?', subtitle: '可能是你沒想到的好處', placeholder: '認識了很多很棒的朋友...', type: 'story', category: 'sys_cat_psychology', categoryName: '心理與哲學' },
]

export const ALL_QUESTIONS = [...CORE_STORIES, ...ONE_LINERS, ...STORIES]
