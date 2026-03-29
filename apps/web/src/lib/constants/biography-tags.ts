/**
 * 系統預設標籤維度和選項
 *
 * @see docs/persona-content-redesign.md
 */

import type { TagDimension, TagOption } from '@/lib/types/biography-v2'

// ═══════════════════════════════════════════
// 系統預設維度 ID 常量
// ═══════════════════════════════════════════

export const SYSTEM_TAG_DIMENSIONS = {
  STYLE_CULT: 'sys_style_cult',
  INJURY_BADGE: 'sys_injury_badge',
  SHOE_FACTION: 'sys_shoe_faction',
  TIME_TYPE: 'sys_time_type',
  LIFESTYLE: 'sys_lifestyle',
  CLIMBING_MUSIC: 'sys_climbing_music',
  FAILURE_RESPONSE: 'sys_failure_response',
  SOCIAL_TYPE: 'sys_social_type',
  CHALK_HABIT: 'sys_chalk_habit',
  TRAINING_APPROACH: 'sys_training_approach',
  LOCAL_IDENTITY: 'sys_local_identity',
} as const

export type SystemTagDimensionId =
  (typeof SYSTEM_TAG_DIMENSIONS)[keyof typeof SYSTEM_TAG_DIMENSIONS]

// ═══════════════════════════════════════════
// 風格邪教
// ═══════════════════════════════════════════

const styleCultOptions: TagOption[] = [
  {
    id: 'sys_style_cult_crack',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#裂隙邪教',
    description: '塞裂隙的快感無可取代',
    order: 1,
  },
  {
    id: 'sys_style_cult_slab',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#Slab邪教',
    description: '平衡就是藝術',
    order: 2,
  },
  {
    id: 'sys_style_cult_overhang',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#外傾邪教',
    description: '沒有倒掛不想爬',
    order: 3,
  },
  {
    id: 'sys_style_cult_dyno',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#Dyno邪教',
    description: '能飛就不要慢慢來',
    order: 4,
  },
  {
    id: 'sys_style_cult_crimp',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#Crimp邪教',
    description: '小點越小越愛',
    order: 5,
  },
  {
    id: 'sys_style_cult_jug',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#大把手邪教',
    description: 'jug 是我的信仰',
    order: 6,
  },
  {
    id: 'sys_style_cult_all',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    label: '#什麼都爬教',
    description: '我不挑',
    order: 7,
  },
]

// ═══════════════════════════════════════════
// 傷痛勳章（14 個症狀標籤）
// ═══════════════════════════════════════════

const injuryBadgeOptions: TagOption[] = [
  {
    id: 'sys_injury_badge_a2',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#A2滑輪倖存者',
    description: '手指滑輪損傷',
    order: 1,
  },
  {
    id: 'sys_injury_badge_trigger_finger',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#扳機指苦主',
    description: '腱鞘炎',
    order: 2,
  },
  {
    id: 'sys_injury_badge_tfcc',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#手腕TFCC',
    description: '三角纖維軟骨損傷',
    order: 3,
  },
  {
    id: 'sys_injury_badge_tennis_elbow',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#網球肘',
    description: '外側上髁炎',
    order: 4,
  },
  {
    id: 'sys_injury_badge_golf_elbow',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#高爾夫球肘',
    description: '內側上髁炎',
    order: 5,
  },
  {
    id: 'sys_injury_badge_impingement',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#肩夾擠',
    description: '肩夾擠症候群',
    order: 6,
  },
  {
    id: 'sys_injury_badge_rotator_cuff',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#旋轉肌撕裂',
    description: '肩旋轉肌損傷',
    order: 7,
  },
  {
    id: 'sys_injury_badge_back',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#下背痛',
    description: '腰椎相關',
    order: 8,
  },
  {
    id: 'sys_injury_badge_knee',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#膝蓋積水',
    description: '膝關節問題',
    order: 9,
  },
  {
    id: 'sys_injury_badge_ankle',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#腳踝扭傷',
    description: '落地傷害',
    order: 10,
  },
  {
    id: 'sys_injury_badge_neck',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#脖子僵硬',
    description: '頸椎不適',
    order: 11,
  },
  {
    id: 'sys_injury_badge_skin',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#手皮勳章',
    description: '撕皮/破皮',
    order: 12,
  },
  {
    id: 'sys_injury_badge_none',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#目前無傷',
    description: '珍惜這個狀態',
    order: 13,
  },
  {
    id: 'sys_injury_badge_rehab',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    label: '#永遠在復健',
    description: '休息也是訓練',
    order: 14,
  },
]

// ═══════════════════════════════════════════
// 鞋子門派
// ═══════════════════════════════════════════

const shoeFactionOptions: TagOption[] = [
  {
    id: 'sys_shoe_faction_lasportiva',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#LaSportiva黨',
    description: 'Solution 是信仰',
    order: 1,
  },
  {
    id: 'sys_shoe_faction_scarpa',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#Scarpa派',
    description: 'Instinct 用過回不去',
    order: 2,
  },
  {
    id: 'sys_shoe_faction_evolv',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#Evolv教',
    description: '美國設計懂我的腳',
    order: 3,
  },
  {
    id: 'sys_shoe_faction_unparallel',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#UnParallel新勢力',
    description: '小眾但好穿',
    order: 4,
  },
  {
    id: 'sys_shoe_faction_many',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#鞋子越多越好',
    description: '不同路線不同鞋',
    order: 5,
  },
  {
    id: 'sys_shoe_faction_one',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#一雙穿到爛',
    description: '感情比性能重要',
    order: 6,
  },
  {
    id: 'sys_shoe_faction_rental',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    label: '#租借鞋也能爬',
    description: '鞋子不是重點',
    order: 7,
  },
]

// ═══════════════════════════════════════════
// 時間型態
// ═══════════════════════════════════════════

const timeTypeOptions: TagOption[] = [
  {
    id: 'sys_time_type_morning',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    label: '#晨型攀岩人',
    description: '早上岩館人少爽爽爬',
    order: 1,
  },
  {
    id: 'sys_time_type_night',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    label: '#夜貓攀岩人',
    description: '下班後的岩館時光',
    order: 2,
  },
  {
    id: 'sys_time_type_weekend',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    label: '#週末戰士',
    description: '平日上班週末爆發',
    order: 3,
  },
  {
    id: 'sys_time_type_lunch',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    label: '#午休攻擊手',
    description: '中午偷爬一下',
    order: 4,
  },
  {
    id: 'sys_time_type_whenever',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    label: '#有空就爬',
    description: '不固定但把握機會',
    order: 5,
  },
  {
    id: 'sys_time_type_fulltime',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    label: '#全職岩棍',
    description: '每天都是攀岩日',
    order: 6,
  },
]

// ═══════════════════════════════════════════
// 生活方式
// ═══════════════════════════════════════════

const lifestyleOptions: TagOption[] = [
  {
    id: 'sys_lifestyle_dirtbag',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    label: '#Dirtbag精神',
    description: '為了爬可以睡車上',
    order: 1,
  },
  {
    id: 'sys_lifestyle_workbag',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    label: '#Workbag',
    description: '有工作但心在岩壁上',
    order: 2,
  },
  {
    id: 'sys_lifestyle_weekend',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    label: '#週末出逃',
    description: '平日社畜週末野人',
    order: 3,
  },
  {
    id: 'sys_lifestyle_gym',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    label: '#岩館居民',
    description: '室內就很滿足了',
    order: 4,
  },
  {
    id: 'sys_lifestyle_travel',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    label: '#旅行攀岩派',
    description: '去哪都要找岩場',
    order: 5,
  },
  {
    id: 'sys_lifestyle_local',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    label: '#就近解決',
    description: '家裡附近的岩館最好',
    order: 6,
  },
]

// ═══════════════════════════════════════════
// 爬牆 BGM
// ═══════════════════════════════════════════

const climbingMusicOptions: TagOption[] = [
  {
    id: 'sys_climbing_music_none',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#不聽音樂派',
    description: '要專心感受動作',
    order: 1,
  },
  {
    id: 'sys_climbing_music_electronic',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#電子Techno',
    description: '節奏帶動身體',
    order: 2,
  },
  {
    id: 'sys_climbing_music_hiphop',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#嘻哈饒舌',
    description: 'Wu-Tang 給我力量',
    order: 3,
  },
  {
    id: 'sys_climbing_music_rock',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#搖滾金屬',
    description: '爆發力來源',
    order: 4,
  },
  {
    id: 'sys_climbing_music_lofi',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#Lofi放鬆',
    description: 'chill 才爬得好',
    order: 5,
  },
  {
    id: 'sys_climbing_music_podcast',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#Podcast派',
    description: '邊聽邊爬',
    order: 6,
  },
  {
    id: 'sys_climbing_music_gym',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    label: '#聽岩館放的',
    description: '沒特別想法',
    order: 7,
  },
]

// ═══════════════════════════════════════════
// 面對失敗
// ═══════════════════════════════════════════

const failureResponseOptions: TagOption[] = [
  {
    id: 'sys_failure_response_retry',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    label: '#再試一次',
    description: '今天一定要送',
    order: 1,
  },
  {
    id: 'sys_failure_response_rest',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    label: '#先休息明天再來',
    description: '不硬拼',
    order: 2,
  },
  {
    id: 'sys_failure_response_switch',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    label: '#換條線',
    description: '這條不適合我',
    order: 3,
  },
  {
    id: 'sys_failure_response_watch',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    label: '#看別人怎麼爬',
    description: '偷學 beta',
    order: 4,
  },
  {
    id: 'sys_failure_response_video',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    label: '#錄影分析',
    description: '科學派',
    order: 5,
  },
  {
    id: 'sys_failure_response_ask',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    label: '#問人請教',
    description: '請教厲害的人',
    order: 6,
  },
]

// ═══════════════════════════════════════════
// 社交類型
// ═══════════════════════════════════════════

const socialTypeOptions: TagOption[] = [
  {
    id: 'sys_social_type_solo',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    label: '#獨攀俠',
    description: '一個人也能爬',
    order: 1,
  },
  {
    id: 'sys_social_type_partner',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    label: '#固定繩伴',
    description: '有穩定的搭檔',
    order: 2,
  },
  {
    id: 'sys_social_type_organizer',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    label: '#揪團仔',
    description: '人多熱鬧',
    order: 3,
  },
  {
    id: 'sys_social_type_shy',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    label: '#社恐但想交朋友',
    description: '默默觀察中',
    order: 4,
  },
  {
    id: 'sys_social_type_talkative',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    label: '#話很多',
    description: '邊爬邊聊',
    order: 5,
  },
  {
    id: 'sys_social_type_quiet',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    label: '#安靜專注派',
    description: '不太講話',
    order: 6,
  },
]

// ═══════════════════════════════════════════
// 抹粉習慣
// ═══════════════════════════════════════════

const chalkHabitOptions: TagOption[] = [
  {
    id: 'sys_chalk_habit_heavy',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CHALK_HABIT,
    label: '#瘋狂抹粉',
    description: '沒在省的',
    order: 1,
  },
  {
    id: 'sys_chalk_habit_moderate',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CHALK_HABIT,
    label: '#適量就好',
    description: '環保一點',
    order: 2,
  },
  {
    id: 'sys_chalk_habit_liquid',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CHALK_HABIT,
    label: '#液態粉派',
    description: '比較不會飛',
    order: 3,
  },
  {
    id: 'sys_chalk_habit_minimal',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CHALK_HABIT,
    label: '#幾乎不抹粉',
    description: '手不太流汗',
    order: 4,
  },
  {
    id: 'sys_chalk_habit_stalling',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.CHALK_HABIT,
    label: '#抹粉等於拖延',
    description: '其實在逃避 crux',
    order: 5,
  },
]

// ═══════════════════════════════════════════
// 訓練取向
// ═══════════════════════════════════════════

const trainingApproachOptions: TagOption[] = [
  {
    id: 'sys_training_approach_climb',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#爬就對了',
    description: '爬多就會進步',
    order: 1,
  },
  {
    id: 'sys_training_approach_hangboard',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#指力板信徒',
    description: 'Hangboard 是日常',
    order: 2,
  },
  {
    id: 'sys_training_approach_campus',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#CampusBoard派',
    description: '爆發力至上',
    order: 3,
  },
  {
    id: 'sys_training_approach_core',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#核心訓練狂',
    description: '身體張力很重要',
    order: 4,
  },
  {
    id: 'sys_training_approach_zen',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#佛系進步',
    description: '有爬就好不強求',
    order: 5,
  },
  {
    id: 'sys_training_approach_planned',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#有計畫訓練',
    description: '週期化、記錄、分析',
    order: 6,
  },
  {
    id: 'sys_training_approach_youtube',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    label: '#YouTube研究員',
    description: '看影片比爬多',
    order: 7,
  },
]

// ═══════════════════════════════════════════
// 在地認同
// ═══════════════════════════════════════════

const localIdentityOptions: TagOption[] = [
  {
    id: 'sys_local_identity_longdong',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LOCAL_IDENTITY,
    label: '#龍洞信徒',
    description: '週末必去朝聖',
    order: 1,
  },
  {
    id: 'sys_local_identity_limestone',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LOCAL_IDENTITY,
    label: '#石灰岩愛好者',
    description: '天然岩壁的魅力',
    order: 2,
  },
  {
    id: 'sys_local_identity_indoor',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LOCAL_IDENTITY,
    label: '#只爬室內派',
    description: '有冷氣有軟墊',
    order: 3,
  },
  {
    id: 'sys_local_identity_anywhere',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LOCAL_IDENTITY,
    label: '#哪裡都爬',
    description: '不挑場地',
    order: 4,
  },
  {
    id: 'sys_local_identity_gym',
    source: 'system',
    dimension_id: SYSTEM_TAG_DIMENSIONS.LOCAL_IDENTITY,
    label: '#岩館常客',
    description: '動態標籤，顯示主場岩館',
    order: 5,
    is_dynamic: true,
    template: '#{value}常客',
    source_field: 'home_gym',
  },
]

// ═══════════════════════════════════════════
// 完整維度定義
// ═══════════════════════════════════════════

export const SYSTEM_TAG_DIMENSION_LIST: TagDimension[] = [
  {
    id: SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
    source: 'system',
    name: '風格邪教',
    emoji: '🔮',
    icon: 'Sparkles',
    description: '你是哪個邪教的？',
    selection_mode: 'multiple',
    options: styleCultOptions,
    order: 1,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
    source: 'system',
    name: '傷痛勳章',
    emoji: '🩹',
    icon: 'HeartPulse',
    description: '攀岩路上的戰績',
    selection_mode: 'multiple',
    options: injuryBadgeOptions,
    order: 2,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
    source: 'system',
    name: '鞋子門派',
    emoji: '👟',
    icon: 'Footprints',
    description: '你的攀岩鞋信仰',
    selection_mode: 'single',
    options: shoeFactionOptions,
    order: 3,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.TIME_TYPE,
    source: 'system',
    name: '時間型態',
    emoji: '⏰',
    icon: 'Clock',
    description: '什麼時候爬？',
    selection_mode: 'multiple',
    options: timeTypeOptions,
    order: 4,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.LIFESTYLE,
    source: 'system',
    name: '生活方式',
    emoji: '🏕️',
    icon: 'Tent',
    description: '攀岩與生活的平衡',
    selection_mode: 'single',
    options: lifestyleOptions,
    order: 5,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.CLIMBING_MUSIC,
    source: 'system',
    name: '爬牆 BGM',
    emoji: '🎵',
    icon: 'Music',
    description: '爬牆時聽什麼？',
    selection_mode: 'single',
    options: climbingMusicOptions,
    order: 6,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.FAILURE_RESPONSE,
    source: 'system',
    name: '面對失敗',
    emoji: '🎯',
    icon: 'Target',
    description: '爬不上去的時候？',
    selection_mode: 'multiple',
    options: failureResponseOptions,
    order: 7,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
    source: 'system',
    name: '社交類型',
    emoji: '👥',
    icon: 'Users',
    description: '你的攀岩社交風格',
    selection_mode: 'single',
    options: socialTypeOptions,
    order: 8,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.CHALK_HABIT,
    source: 'system',
    name: '抹粉習慣',
    emoji: '🤲',
    icon: 'Hand',
    description: '對於碳酸鎂的態度',
    selection_mode: 'single',
    options: chalkHabitOptions,
    order: 9,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
    source: 'system',
    name: '訓練取向',
    emoji: '💪',
    icon: 'Dumbbell',
    description: '怎麼變強？',
    selection_mode: 'multiple',
    options: trainingApproachOptions,
    order: 10,
    is_active: true,
  },
  {
    id: SYSTEM_TAG_DIMENSIONS.LOCAL_IDENTITY,
    source: 'system',
    name: '在地認同',
    emoji: '📍',
    icon: 'MapPin',
    description: '你的攀岩地盤',
    selection_mode: 'multiple',
    options: localIdentityOptions,
    order: 11,
    is_active: true,
  },
]

// ═══════════════════════════════════════════
// 工具函數
// ═══════════════════════════════════════════

/**
 * 取得所有標籤選項（扁平化）
 */
export function getAllTagOptions(): TagOption[] {
  return SYSTEM_TAG_DIMENSION_LIST.flatMap((dim) => dim.options)
}

/**
 * 根據維度 ID 取得維度
 */
export function getTagDimensionById(dimensionId: string): TagDimension | undefined {
  return SYSTEM_TAG_DIMENSION_LIST.find((dim) => dim.id === dimensionId)
}

/**
 * 根據選項 ID 取得選項
 */
export function getTagOptionById(optionId: string): TagOption | undefined {
  return getAllTagOptions().find((opt) => opt.id === optionId)
}

/**
 * 根據選項 ID 取得所屬維度
 */
export function getTagDimensionByOptionId(optionId: string): TagDimension | undefined {
  const option = getTagOptionById(optionId)
  if (!option) return undefined
  return getTagDimensionById(option.dimension_id)
}
