/**
 * 攀岩訓練計畫常數
 *
 * 資料來源：
 * - Eric Horst "Training for Climbing" (3rd ed., 2016)
 * - Steve Maisch (TrainingBeta Podcast #025)
 * - Joshua Rucci / TrainingBeta (Periodized Training for Climbing)
 * - Sergio Consuegra "The Science of Climbing Training"
 * - Michael Larson / The Climbing Doctor (Seasonal Framework)
 * - PMC study: Effects of Prioritizing Lead or Boulder Climbing (2021)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 攀岩者訓練等級 */
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced'

/** 訓練階段 */
export type TrainingPhase =
  | 'base_endurance'
  | 'hypertrophy'
  | 'strength'
  | 'power'
  | 'power_endurance'
  | 'performance'
  | 'rest'
  | 'taper'

/** 運動分類 */
export type ExerciseCategory =
  | 'hangboard'
  | 'campus_board'
  | 'pull_ups'
  | 'core'
  | 'endurance'
  | 'technique'
  | 'mental'

/** 週期化模型類型 */
export type PeriodizationType = 'linear' | 'conjugate' | 'concurrent' | 'strength_continuum'

/** 訓練階段定義 */
export interface PhaseDefinition {
  /** 階段 ID */
  phase: TrainingPhase
  /** 階段名稱 */
  label: string
  /** 中文名稱 */
  labelZh: string
  /** 建議持續週數 [最小, 最大] */
  durationWeeks: [number, number]
  /** 訓練量（相對描述） */
  volume: 'high' | 'moderate' | 'low'
  /** 訓練強度（相對描述） */
  intensity: 'high' | 'moderate' | 'low'
  /** 重點描述 */
  focus: string
}

/** 週期化模型 */
export interface PeriodizationModel {
  /** 模型 ID */
  id: PeriodizationType
  /** 模型名稱 */
  name: string
  /** 中文名稱 */
  nameZh: string
  /** 資料來源 */
  source: string
  /** 建議等級 */
  recommendedLevels: TrainingLevel[]
  /** 訓練階段序列 */
  phases: PhaseDefinition[]
  /** 說明 */
  description: string
}

/** 訓練動作協議 */
export interface ExerciseProtocol {
  /** 動作 ID */
  id: string
  /** 動作名稱 */
  name: string
  /** 中文名稱 */
  nameZh: string
  /** 分類 */
  category: ExerciseCategory
  /** 資料來源 */
  source: string
  /** 建議等級 */
  recommendedLevels: TrainingLevel[]
  /** 組數 [最小, 最大] */
  sets: [number, number]
  /** 次數或持續時間描述 */
  reps: string
  /** 休息時間（秒）[最小, 最大] */
  restSeconds: [number, number]
  /** 每週訓練次數 [最小, 最大] */
  sessionsPerWeek: [number, number]
  /** 訓練週期（週）[最小, 最大] */
  cycleWeeks: [number, number]
  /** 額外說明 */
  notes: string
}

/** 等級訓練建議 */
export interface LevelRecommendation {
  /** 等級 */
  level: TrainingLevel
  /** 等級名稱 */
  label: string
  /** 中文名稱 */
  labelZh: string
  /** 對應難度範圍 (運動攀) */
  sportGradeRange: string
  /** 對應難度範圍 (抱石) */
  boulderGradeRange: string
  /** 建議週期化模型 */
  periodizationType: PeriodizationType
  /** 每週訓練天數 [最小, 最大] */
  daysPerWeek: [number, number]
  /** 每次訓練時數 [最小, 最大] */
  hoursPerSession: [number, number]
  /** 重點項目 */
  focusAreas: string[]
  /** 避免項目 */
  avoid: string[]
  /** 建議運動 ID 列表 */
  recommendedExerciseIds: string[]
}

/** 弱點訓練模板 */
export interface AntiStyleTemplate {
  /** 模板 ID */
  id: string
  /** 模板名稱 */
  name: string
  /** 中文名稱 */
  nameZh: string
  /** 適用對象描述 */
  targetProfile: string
  /** 資料來源 */
  source: string
  /** 強調訓練（每週次數） */
  emphasisSessionsPerWeek: number
  /** 維持訓練（每週次數） */
  maintenanceSessionsPerWeek: number
  /** 建議輪替週數 [最小, 最大] */
  rotationWeeks: [number, number]
  /** 強調訓練內容 */
  emphasisExerciseIds: string[]
  /** 維持訓練內容 */
  maintenanceExerciseIds: string[]
  /** 說明 */
  description: string
}

// ---------------------------------------------------------------------------
// 1. Periodization Models
// ---------------------------------------------------------------------------

/**
 * 週期化訓練模型
 *
 * @source Rucci/TrainingBeta, Consuegra, Horst, Climbing Doctor
 */
export const PERIODIZATION_MODELS: PeriodizationModel[] = [
  {
    id: 'linear',
    name: 'Linear (Sequential) Periodization',
    nameZh: '線性週期化',
    source: 'Matveyev (1977) / Rucci via TrainingBeta / Horst T4C',
    recommendedLevels: ['beginner'],
    phases: [
      {
        phase: 'base_endurance',
        label: 'Base / Endurance',
        labelZh: '基礎耐力期',
        durationWeeks: [4, 6],
        volume: 'high',
        intensity: 'low',
        focus: 'Aerobic base, technique refinement, varied terrain exposure',
      },
      {
        phase: 'strength',
        label: 'Strength',
        labelZh: '力量期',
        durationWeeks: [3, 4],
        volume: 'moderate',
        intensity: 'moderate',
        focus: 'Max grip strength, pull-up progression, lock-off training',
      },
      {
        phase: 'power',
        label: 'Power',
        labelZh: '爆發力期',
        durationWeeks: [2, 3],
        volume: 'low',
        intensity: 'high',
        focus: 'Dynamic movements, campus board, limit bouldering',
      },
      {
        phase: 'power_endurance',
        label: 'Power Endurance',
        labelZh: '力量耐力期',
        durationWeeks: [2, 4],
        volume: 'moderate',
        intensity: 'high',
        focus: '4x4s, route intervals, sustained climbing at threshold',
      },
      {
        phase: 'rest',
        label: 'Rest / Recovery',
        labelZh: '休息恢復期',
        durationWeeks: [1, 2],
        volume: 'low',
        intensity: 'low',
        focus: 'Active recovery, light climbing, stretching, sleep',
      },
    ],
    description:
      'Linear progression from high-volume/low-intensity to low-volume/high-intensity. ' +
      'Best for beginners building a solid base. One peak per macrocycle.',
  },
  {
    id: 'conjugate',
    name: 'Conjugate Periodization',
    nameZh: '共軛週期化',
    source: 'Rucci via TrainingBeta / Westside Barbell adapted',
    recommendedLevels: ['intermediate', 'advanced'],
    phases: [
      {
        phase: 'strength',
        label: 'Emphasis Block',
        labelZh: '強調訓練區塊',
        durationWeeks: [1, 4],
        volume: 'moderate',
        intensity: 'high',
        focus: 'Prioritize ONE training goal (e.g. strength) while maintaining others',
      },
      {
        phase: 'power_endurance',
        label: 'Maintenance Sessions',
        labelZh: '維持訓練',
        durationWeeks: [1, 4],
        volume: 'low',
        intensity: 'moderate',
        focus: 'Train non-emphasis goals just enough to maintain current level',
      },
    ],
    description:
      'Emphasize one training goal while maintaining all others within weekly microcycles. ' +
      'Rotate emphasis every 1-4 weeks. Avoids detraining of non-emphasized qualities. ' +
      'Recommended as the best model for most climbers by Rucci.',
  },
  {
    id: 'concurrent',
    name: 'Concurrent Periodization',
    nameZh: '並行週期化',
    source: 'Rucci via TrainingBeta',
    recommendedLevels: ['advanced'],
    phases: [
      {
        phase: 'strength',
        label: 'All Goals Equal Emphasis',
        labelZh: '所有目標等權重',
        durationWeeks: [1, 1],
        volume: 'high',
        intensity: 'high',
        focus:
          'Each training goal trained equally within one weekly microcycle. ' +
          'Requires advanced recovery capacity and body awareness.',
      },
    ],
    description:
      'All training goals (strength, power, endurance, stamina) given equal emphasis ' +
      'within each week. Only for advanced climbers who can handle high total training load. ' +
      'Risk of overtraining if scheduling is poor.',
  },
  {
    id: 'strength_continuum',
    name: 'Strength Continuum (Seasonal)',
    nameZh: '力量光譜（季節性）',
    source: 'Steve Bechtel / Climb Strong / Michael Larson / The Climbing Doctor',
    recommendedLevels: ['intermediate', 'advanced'],
    phases: [
      {
        phase: 'hypertrophy',
        label: 'General Strength',
        labelZh: '一般力量期',
        durationWeeks: [4, 6],
        volume: 'moderate',
        intensity: 'high',
        focus:
          'Heavy stable exercises (weighted pull-ups, squats, deadlifts). ' +
          '3 days/week, 5 sets x 2-3 reps (10-15 total), load >= 85% 1RM',
      },
      {
        phase: 'strength',
        label: 'Stability Strength',
        labelZh: '穩定力量期',
        durationWeeks: [8, 20],
        volume: 'moderate',
        intensity: 'moderate',
        focus:
          'Medium-stability exercises (explosive pull-ups, offset pull-ups, split squats). ' +
          '1-2 days/week, 2-3 sets x 5-10 reps, 8/10 subjective effort',
      },
      {
        phase: 'performance',
        label: 'Specific Strength',
        labelZh: '專項力量期',
        durationWeeks: [2, 6],
        volume: 'low',
        intensity: 'moderate',
        focus:
          'Sport-specific exercises (lock-offs, wall crawls, pistol squats). ' +
          '1 day/week, 2-3 sets x few reps. Focus on climbing performance.',
      },
    ],
    description:
      'Seasonal framework progressing from stable/heavy to unstable/specific exercises. ' +
      'General Strength in off-season, Stability Strength pre-season, ' +
      'Specific Strength during performance season.',
  },
] as const

/**
 * Horst 4-3-2-1 訓練週期
 *
 * @source Eric Horst "Training for Climbing" (3rd ed.)
 */
export const HORST_4_3_2_1_CYCLE = {
  name: 'Horst 4-3-2-1 Training Cycle',
  nameZh: 'Horst 4-3-2-1 訓練週期',
  source: 'Eric Horst, Training for Climbing (3rd ed., 2016)',
  totalWeeks: 10,
  mesocycles: [
    {
      name: 'Mesocycle 1: Strength & Power',
      nameZh: '中週期 1：力量與爆發力',
      weeks: 4,
      focus: 'Low volume max strength and power training targeting anaerobic alactic energy system',
    },
    {
      name: 'Mesocycle 2: Daily Undulating (Recovery)',
      nameZh: '中週期 2：每日波動（恢復）',
      weeks: 1,
      focus: 'Submaximal recovery/ARC climbing, stabilizer & antagonist exercises',
    },
    {
      name: 'Mesocycle 3: Strength/Power Endurance',
      nameZh: '中週期 3：力量耐力',
      weeks: 3,
      focus:
        'High volume submaximal climbing, moderate S/PE training, many pumpy climbs targeting anaerobic lactic system',
    },
    {
      name: 'Pre-trip/Pre-comp Taper',
      nameZh: '賽前／旅行前減量',
      weeks: 2,
      focus:
        'Reduce volume 41-60%, maintain intensity, prioritize recovery and movement efficiency',
    },
  ],
} as const

/**
 * 減量（Taper）指引
 *
 * @source Mujika & Bosquet (2016) via Consuegra
 */
export const TAPER_GUIDELINES = {
  source: 'Mujika & Bosquet (2016) via Consuegra "The Science of Climbing Training"',
  durationWeeks: 4,
  volumeReductionPercent: [41, 60],
  rules: [
    'Reduce number of sessions first, then duration of each session',
    'Maintain intensity — do not increase',
    'Do not use final sessions as tests',
    'Adapt calorie intake to reduced energy needs to avoid weight gain',
    'Prioritize movement efficiency and maximum power development',
    'Favor heavy weights over light weights',
    'Ensure full recovery between sessions',
  ],
  physiologicalEffects: [
    'Increases fast-twitch muscle fiber diameter',
    'Boosts neural electrical activity',
    'Makes glycolysis more efficient at maximum intensity',
    'Modifies anabolic hormonal response',
  ],
  avgPerformanceImprovement: '1.96%',
} as const

// ---------------------------------------------------------------------------
// 2. Exercise Protocols
// ---------------------------------------------------------------------------

/**
 * 訓練動作協議
 *
 * 每個動作包含具體的組數、次數、休息時間等參數
 */
export const EXERCISE_PROTOCOLS: ExerciseProtocol[] = [
  // --- Hangboard ---
  {
    id: 'hangboard_max_hangs',
    name: 'Max Hangs (Maisch Protocol)',
    nameZh: '最大懸掛（Maisch 方法）',
    category: 'hangboard',
    source: 'Steve Maisch via TrainingBeta Podcast #025',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [5, 5],
    reps: '10-13 sec hang per set, 3 grip positions per session',
    restSeconds: [240, 300],
    sessionsPerWeek: [2, 2],
    cycleWeeks: [3, 6],
    notes:
      'Use 18-20mm edge. Larger edge + more weight is superior to smaller edge + less weight ' +
      '(Eva Lopez study). Half crimp, open hand, 2-finger pocket. ' +
      'Plateau occurs after ~6 sessions; switch to repeaters for 3 weeks (5-3-1 method).',
  },
  {
    id: 'hangboard_repeaters',
    name: 'Fingerboard Repeaters (Horst Protocol)',
    nameZh: '指板反覆訓練（Horst 方法）',
    category: 'hangboard',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [3, 6],
    reps: '7 sec on / 3 sec off, repeat for full set; different grip each set',
    restSeconds: [180, 300],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [2, 4],
    notes:
      'Best for developing max grip strength via repeated high-intensity contractions. ' +
      'Complete warm-up mandatory. Pyramid variant: 7 ascending/descending intensity steps on same grip.',
  },
  {
    id: 'hangboard_hit',
    name: 'Hypergravity Isolation Training (HIT)',
    nameZh: '超重力隔離訓練（HIT）',
    category: 'hangboard',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['advanced'],
    sets: [1, 2],
    reps: '<=20 hand moves per set (10 per hand); add weight to ensure failure within range',
    restSeconds: [180, 180],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [2, 3],
    notes:
      'Cycle on/off every 2 weeks, or during 3-week max-strength phase of 4-3-2-1 cycle. ' +
      '2-4 rest days between sessions. Tape fingers (X method). ' +
      'Never perform more than 2 sets per grip position.',
  },
  {
    id: 'hangboard_straight_arm',
    name: 'Straight-Arm Fingerboard Hangs',
    nameZh: '直臂指板懸掛',
    category: 'hangboard',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['beginner', 'intermediate'],
    sets: [3, 5],
    reps: 'Hang until near failure (typically 60-120 sec), or interval: end before failure',
    restSeconds: [300, 300],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [4, 8],
    notes:
      'Basic endurance exercise for novice climbers. Interval approach preferred: ' +
      'end each hang before muscular failure, rest 5 min, repeat 5 sets.',
  },

  // --- Campus Board ---
  {
    id: 'campus_bumps',
    name: 'Campus Board Bumps',
    nameZh: 'Campus 板跳躍',
    category: 'campus_board',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['advanced'],
    sets: [4, 8],
    reps: 'Each side',
    restSeconds: [60, 300],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes: 'One hand bumps upward while the other stays. Train each side equally.',
  },
  {
    id: 'campus_laddering',
    name: 'Campus Laddering (No Skips)',
    nameZh: 'Campus 板階梯攀爬（不跳格）',
    category: 'campus_board',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['advanced'],
    sets: [2, 10],
    reps: 'Up only, small rungs',
    restSeconds: [60, 300],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes: 'Laddering with larger rungs and skips for more advanced variation.',
  },
  {
    id: 'campus_switch_hands',
    name: 'Campus Switch Hands',
    nameZh: 'Campus 板換手',
    category: 'campus_board',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['advanced'],
    sets: [3, 4],
    reps: '10 moves per set',
    restSeconds: [60, 300],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes: 'Both hands jump simultaneously to the same rung, then switch.',
  },
  {
    id: 'campus_double_dynos',
    name: 'Campus Double Dynos',
    nameZh: 'Campus 板雙手動態',
    category: 'campus_board',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['advanced'],
    sets: [3, 4],
    reps: '10 moves per set, small rungs',
    restSeconds: [60, 300],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes: 'Both hands release and catch simultaneously. High injury risk; advanced only.',
  },

  // --- Pull-ups ---
  {
    id: 'pullups_aided',
    name: 'Aided Pull-Ups',
    nameZh: '輔助引體向上',
    category: 'pull_ups',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['beginner'],
    sets: [3, 3],
    reps: '8-12 reps (spotter lifts partial body weight)',
    restSeconds: [120, 180],
    sessionsPerWeek: [3, 3],
    cycleWeeks: [4, 8],
    notes: 'Use if unable to do 3 sets of 8 unassisted pull-ups. Progress to unassisted.',
  },
  {
    id: 'pullups_standard',
    name: 'Standard Pull-Ups',
    nameZh: '標準引體向上',
    category: 'pull_ups',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['beginner', 'intermediate'],
    sets: [3, 5],
    reps: '8-15 reps; >15 reps trains endurance more than strength',
    restSeconds: [120, 180],
    sessionsPerWeek: [3, 3],
    cycleWeeks: [4, 12],
    notes: 'Staple exercise. When 15+ reps achieved, progress to weighted pull-ups.',
  },
  {
    id: 'pullups_hypergravity',
    name: 'Hypergravity (Weighted) Pull-Ups',
    nameZh: '超重力（負重）引體向上',
    category: 'pull_ups',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [2, 4],
    reps: 'Add weight; increase 10 lbs when 3x12 achieved',
    restSeconds: [180, 300],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [4, 8],
    notes:
      'Do not hang in straight-arm position between reps (stressful on shoulders). ' +
      'Weight vest or belt recommended.',
  },
  {
    id: 'pullups_uneven_grip',
    name: 'Uneven-Grip Pull-Ups',
    nameZh: '不等握距引體向上',
    category: 'pull_ups',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [2, 4],
    reps: 'Offset one hand 12-24 inches lower; work toward one-arm pull-up',
    restSeconds: [180, 300],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [4, 8],
    notes: 'Excellent for developing one-arm strength and lock-off ability.',
  },
  {
    id: 'lockoff_one_arm',
    name: 'One-Arm Lock-Offs',
    nameZh: '單臂鎖定',
    category: 'pull_ups',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['advanced'],
    sets: [2, 4],
    reps: 'Hold 2 sec at lock-off position; 2-4 reps per hand',
    restSeconds: [60, 180],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes:
      '1 min rest between arms, 3 min rest between rounds. ' +
      'Prerequisite: must be able to hold a solid one-arm lock-off first.',
  },
  {
    id: 'pullups_power',
    name: 'Power Pull-Ups (Chest Bump)',
    nameZh: '爆發引體向上（胸碰槓）',
    category: 'pull_ups',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [3, 3],
    reps: '10 reps',
    restSeconds: [60, 120],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes: 'Explosive concentric phase, pull chest to bar level.',
  },

  // --- Core ---
  {
    id: 'core_steep_wall_traverse',
    name: 'Steep Wall Traversing',
    nameZh: '陡壁橫移',
    category: 'core',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [6, 10],
    reps: '30+ sec per set',
    restSeconds: [30, 60],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [4, 8],
    notes: 'Focus on body tension and engaging core throughout movement.',
  },
  {
    id: 'core_front_lever',
    name: 'Front Lever',
    nameZh: '前水平',
    category: 'core',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['advanced'],
    sets: [1, 5],
    reps: '1-5 sec hold',
    restSeconds: [120, 180],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [4, 12],
    notes: 'Progress through tuck, advanced tuck, one-leg, straddle, full.',
  },
  {
    id: 'core_steep_wall_cut_catch',
    name: 'Steep Wall Cut & Catch',
    nameZh: '陡壁脫腳抓回',
    category: 'core',
    source: 'Eric Horst, T4C Advanced Program',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [3, 5],
    reps: '1 ascent per set; 3-10 cut-and-catch moves',
    restSeconds: [60, 120],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes: 'Practice controlled foot cuts and re-engagement on steep terrain.',
  },
  {
    id: 'core_plank_training',
    name: '4-Minute Plank Training',
    nameZh: '4 分鐘棒式訓練',
    category: 'core',
    source: 'Eric Horst, trainingforclimbing.com',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [1, 3],
    reps: 'Build to 4 min continuous hold; progress through variations',
    restSeconds: [60, 120],
    sessionsPerWeek: [3, 5],
    cycleWeeks: [4, 12],
    notes: 'Front plank, side plank, reverse plank rotations.',
  },

  // --- Endurance ---
  {
    id: 'endurance_arc',
    name: 'ARC Training (Aerobic Restoration & Capillarity)',
    nameZh: 'ARC 有氧毛細血管訓練',
    category: 'endurance',
    source: 'Eric Horst / Anderson Brothers',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [1, 3],
    reps: '15-20+ min continuous climbing at RPE 4-6',
    restSeconds: [300, 600],
    sessionsPerWeek: [2, 4],
    cycleWeeks: [4, 6],
    notes:
      'Maintain light pump, never reach failure. Traverse or easy routes. ' +
      'Key for base endurance phase and recovery weeks.',
  },
  {
    id: 'endurance_4x4',
    name: '4x4s',
    nameZh: '4x4 耐力訓練',
    category: 'endurance',
    source: 'TrainingBeta / widely used protocol',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [4, 4],
    reps: '4 boulder problems back-to-back (no rest between); ~2 V-grades below max',
    restSeconds: [60, 120],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes:
      '4 problems x 4 rounds. Will generate significant lactic acid / pump. ' +
      'More pumpy than route intervals because problems are done consecutively.',
  },
  {
    id: 'endurance_tabata',
    name: 'Tabata Protocol',
    nameZh: 'Tabata 間歇訓練',
    category: 'endurance',
    source: 'Tabata et al. (1996) / Eric Horst adaptation',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [1, 2],
    reps: '20 sec climbing on / 10 sec off x 8 rounds (4 min total)',
    restSeconds: [240, 300],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [2, 4],
    notes:
      'Effective for training both anaerobic and aerobic systems simultaneously. ' +
      'Can be done on small home wall. Very intense.',
  },
  {
    id: 'endurance_route_intervals',
    name: 'Route/Boulder Intervals (Maisch Protocol)',
    nameZh: '路線間歇訓練（Maisch 方法）',
    category: 'endurance',
    source: 'Steve Maisch via TrainingBeta Podcast #025',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [3, 5],
    reps: '15-move boulder problem x 4 reps per set',
    restSeconds: [60, 120],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes:
      'Each set uses a different problem. Rest 1-2 min between reps within a set. ' +
      'Less pumpy than 4x4s; targets slightly different energy system.',
  },
  {
    id: 'endurance_fingerboard_moving_hangs',
    name: 'Fingerboard Moving Hangs',
    nameZh: '指板移動懸掛',
    category: 'endurance',
    source: 'Eric Horst, Training for Climbing (3rd ed.)',
    recommendedLevels: ['intermediate', 'advanced'],
    sets: [2, 4],
    reps: 'Change hand positions every 3-5 sec; sustain for several minutes; 30-60 total moves',
    restSeconds: [180, 300],
    sessionsPerWeek: [1, 2],
    cycleWeeks: [3, 6],
    notes:
      'Place feet on footholds or chair edge. Use grip-relax repeating sequence. ' +
      'Rest on large holds when pumped, then resume.',
  },

  // --- Technique ---
  {
    id: 'technique_silent_feet',
    name: 'Silent Feet Drill',
    nameZh: '靜音踩腳訓練',
    category: 'technique',
    source: 'Neil Gresham / widely used drill',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [3, 5],
    reps: '1 boulder problem or route per set; zero audible foot placements',
    restSeconds: [60, 120],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [2, 8],
    notes:
      'Place feet with zero noise. Forces precise, deliberate footwork. ' +
      'Foundational drill for all levels.',
  },
  {
    id: 'technique_hover_hand',
    name: 'Hover Hand Drill',
    nameZh: '懸停手訓練',
    category: 'technique',
    source: 'Neil Gresham / common coaching drill',
    recommendedLevels: ['beginner', 'intermediate'],
    sets: [3, 5],
    reps: 'Hover hand over target hold for 2-3 sec before grabbing; 1 problem per set',
    restSeconds: [60, 120],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [2, 6],
    notes: 'Trains precision and eliminates rushed, inaccurate hand placements.',
  },
  {
    id: 'technique_down_climbing',
    name: 'Down-Climbing',
    nameZh: '反向攀爬',
    category: 'technique',
    source: 'Common coaching drill / Horst',
    recommendedLevels: ['beginner', 'intermediate'],
    sets: [3, 6],
    reps: 'Climb up, then reverse every move back down; 1 problem per set',
    restSeconds: [60, 180],
    sessionsPerWeek: [2, 3],
    cycleWeeks: [2, 8],
    notes: 'Excellent for body awareness, control, and endurance. Doubles time on wall.',
  },
  {
    id: 'technique_varied_terrain',
    name: 'Varied Terrain Exploration',
    nameZh: '多種地形練習',
    category: 'technique',
    source: 'Consuegra / Horst general preparation guidelines',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [1, 1],
    reps: 'Climb slabs, cracks, overhangs, dihedrals, aretes in one session',
    restSeconds: [60, 180],
    sessionsPerWeek: [1, 3],
    cycleWeeks: [4, 12],
    notes:
      'Essential during general preparation period. Builds broad movement vocabulary. ' +
      'Different disciplines, rock types, and styles.',
  },

  // --- Mental ---
  {
    id: 'mental_visualization',
    name: 'Route Visualization',
    nameZh: '路線視覺化',
    category: 'mental',
    source: 'Eric Horst, Training for Climbing ch.3',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [1, 3],
    reps: '5-10 min per session; visualize full sequence of moves before attempting',
    restSeconds: [0, 0],
    sessionsPerWeek: [3, 7],
    cycleWeeks: [4, 52],
    notes:
      'Close eyes and rehearse the climb mentally — every hand placement, foot placement, ' +
      'body position, and breathing. Most effective immediately before attempts.',
  },
  {
    id: 'mental_progressive_relaxation',
    name: 'Progressive Relaxation Sequence',
    nameZh: '漸進式放鬆',
    category: 'mental',
    source: 'Eric Horst, Training for Climbing ch.3',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [1, 1],
    reps: '10-15 min; systematically tense then relax each muscle group',
    restSeconds: [0, 0],
    sessionsPerWeek: [3, 7],
    cycleWeeks: [4, 52],
    notes:
      'Effective before sleep or midday for recovery. Quiets the mind and relaxes muscles. ' +
      'Also useful at the crag between attempts.',
  },
  {
    id: 'mental_self_assessment',
    name: 'Performance Triad Self-Assessment',
    nameZh: '表現三角自我評估',
    category: 'mental',
    source: 'Eric Horst, Training for Climbing ch.2',
    recommendedLevels: ['beginner', 'intermediate', 'advanced'],
    sets: [1, 1],
    reps: 'Score mental, technical, and physical abilities; identify weakest area',
    restSeconds: [0, 0],
    sessionsPerWeek: [0, 1],
    cycleWeeks: [4, 12],
    notes:
      'Answer targeted questions about failure modes. Compare scores across three pillars. ' +
      'Use lowest-scoring area to guide next training cycle emphasis.',
  },
] as const

// ---------------------------------------------------------------------------
// 3. Training by Level
// ---------------------------------------------------------------------------

/**
 * 各等級訓練建議
 *
 * @source Eric Horst (Free Training Programs), Rucci/TrainingBeta, Climbing Doctor
 */
export const TRAINING_BY_LEVEL: LevelRecommendation[] = [
  {
    level: 'beginner',
    label: 'Beginner',
    labelZh: '初學者',
    sportGradeRange: '<5.11',
    boulderGradeRange: '<V4',
    periodizationType: 'linear',
    daysPerWeek: [2, 5],
    hoursPerSession: [1, 2.5],
    focusAreas: [
      'Technique refinement and movement vocabulary',
      'Body composition and general conditioning',
      'Climbing-specific endurance (ARC)',
      'Basic pull-up progression',
      'Antagonist and stabilizer muscle strength',
      'Fear management and mental skills',
    ],
    avoid: [
      'Hangboard training (injury risk too high)',
      'Campus board',
      'Limit bouldering (max effort attempts)',
      'High-intensity finger training',
    ],
    recommendedExerciseIds: [
      'pullups_aided',
      'pullups_standard',
      'endurance_arc',
      'core_plank_training',
      'technique_silent_feet',
      'technique_hover_hand',
      'technique_down_climbing',
      'technique_varied_terrain',
      'mental_visualization',
      'mental_progressive_relaxation',
      'mental_self_assessment',
      'hangboard_straight_arm',
    ],
  },
  {
    level: 'intermediate',
    label: 'Intermediate',
    labelZh: '中級者',
    sportGradeRange: '5.11a - 5.13a',
    boulderGradeRange: 'V4 - V8',
    periodizationType: 'conjugate',
    daysPerWeek: [3, 6],
    hoursPerSession: [1.5, 4],
    focusAreas: [
      'Max strength and power via limit bouldering',
      'Hangboard training (repeaters, max hangs)',
      'Strength/power endurance (4x4s, route intervals)',
      'Stamina and aerobic endurance',
      'Rotator cuff and stabilizer strengthening',
      'Technical and mental skill refinement',
    ],
    avoid: [
      'Campus board double dynos (injury risk)',
      'HIT system without adequate base strength',
      'Concurrent periodization (overtraining risk)',
    ],
    recommendedExerciseIds: [
      'hangboard_max_hangs',
      'hangboard_repeaters',
      'pullups_hypergravity',
      'pullups_uneven_grip',
      'pullups_power',
      'endurance_4x4',
      'endurance_route_intervals',
      'endurance_tabata',
      'endurance_arc',
      'endurance_fingerboard_moving_hangs',
      'core_steep_wall_traverse',
      'core_steep_wall_cut_catch',
      'core_plank_training',
      'technique_silent_feet',
      'technique_varied_terrain',
      'mental_visualization',
      'mental_self_assessment',
    ],
  },
  {
    level: 'advanced',
    label: 'Advanced',
    labelZh: '進階者',
    sportGradeRange: '>5.13a',
    boulderGradeRange: '>V8',
    periodizationType: 'conjugate',
    daysPerWeek: [4, 6],
    hoursPerSession: [1.5, 5],
    focusAreas: [
      'Elite-level finger strength (HIT system)',
      'Campus board power training',
      'Advanced periodization (conjugate or concurrent)',
      'RPE-based energy system targeting',
      'One-arm training and lock-offs',
      'Recovery optimization and injury avoidance',
    ],
    avoid: [
      'Training through pain or injury warning signs',
      'Neglecting antagonist and stabilizer work',
      'Concurrent periodization without excellent body awareness',
    ],
    recommendedExerciseIds: [
      'hangboard_max_hangs',
      'hangboard_repeaters',
      'hangboard_hit',
      'campus_bumps',
      'campus_laddering',
      'campus_switch_hands',
      'campus_double_dynos',
      'pullups_hypergravity',
      'pullups_uneven_grip',
      'lockoff_one_arm',
      'pullups_power',
      'endurance_4x4',
      'endurance_route_intervals',
      'endurance_tabata',
      'endurance_fingerboard_moving_hangs',
      'core_front_lever',
      'core_steep_wall_traverse',
      'core_steep_wall_cut_catch',
      'technique_varied_terrain',
      'mental_visualization',
      'mental_progressive_relaxation',
      'mental_self_assessment',
    ],
  },
] as const

// ---------------------------------------------------------------------------
// 4. Anti-Style (Weakness) Training Templates
// ---------------------------------------------------------------------------

/**
 * 弱點訓練模板
 *
 * 基於共軛週期化原則：強調弱項，維持強項
 * @source Rucci/TrainingBeta, PMC study (2021), Horst self-assessment
 */
export const ANTI_STYLE_PROTOCOLS: AntiStyleTemplate[] = [
  {
    id: 'power_climber_needs_endurance',
    name: 'Power Climber Needing Endurance',
    nameZh: '力量型攀岩者 — 補強耐力',
    targetProfile:
      'Strong boulderer who pumps out on routes. Can send hard short problems but struggles on sustained climbing.',
    source: 'Rucci/TrainingBeta conjugate method',
    emphasisSessionsPerWeek: 3,
    maintenanceSessionsPerWeek: 2,
    rotationWeeks: [2, 4],
    emphasisExerciseIds: [
      'endurance_4x4',
      'endurance_route_intervals',
      'endurance_arc',
      'endurance_fingerboard_moving_hangs',
    ],
    maintenanceExerciseIds: ['hangboard_max_hangs', 'pullups_hypergravity', 'campus_bumps'],
    description:
      'Emphasize power endurance and aerobic capacity 3 sessions/week. ' +
      'Maintain strength with 1-2 bouldering/hangboard sessions. ' +
      'Rotate emphasis every 2-4 weeks to prevent detraining.',
  },
  {
    id: 'endurance_climber_needs_power',
    name: 'Endurance Climber Needing Power',
    nameZh: '耐力型攀岩者 — 補強爆發力',
    targetProfile:
      'Strong route climber who cannot pull hard individual moves. Good stamina but weak on crux sequences.',
    source: 'Rucci/TrainingBeta conjugate method',
    emphasisSessionsPerWeek: 3,
    maintenanceSessionsPerWeek: 1,
    rotationWeeks: [2, 4],
    emphasisExerciseIds: [
      'hangboard_max_hangs',
      'hangboard_hit',
      'campus_bumps',
      'campus_laddering',
      'pullups_hypergravity',
      'lockoff_one_arm',
    ],
    maintenanceExerciseIds: ['endurance_arc', 'endurance_4x4'],
    description:
      'Emphasize max strength and power 2-3 bouldering/campus sessions per week. ' +
      'Maintain endurance with 1 ARC or route session. ' +
      'Switch emphasis every 2-4 weeks.',
  },
  {
    id: 'strong_climber_weak_technique',
    name: 'Strong Climber with Weak Technique',
    nameZh: '力量足夠但技術不足',
    targetProfile:
      'Relies on brute strength to pull through moves. Poor footwork, inefficient body positioning. ' +
      'Often plateaus despite being physically strong.',
    source: 'Horst self-assessment / The Climbing Doctor',
    emphasisSessionsPerWeek: 3,
    maintenanceSessionsPerWeek: 2,
    rotationWeeks: [4, 8],
    emphasisExerciseIds: [
      'technique_silent_feet',
      'technique_hover_hand',
      'technique_down_climbing',
      'technique_varied_terrain',
    ],
    maintenanceExerciseIds: ['hangboard_max_hangs', 'pullups_hypergravity', 'core_plank_training'],
    description:
      'Dedicate 3 sessions/week to deliberate technique practice on varied terrain. ' +
      'Climb below max grade focusing on movement quality, not difficulty. ' +
      'Maintain strength with 1-2 supplemental sessions. Longer rotation (4-8 weeks) ' +
      'because technique improvements are slower than strength gains.',
  },
  {
    id: 'mental_weakness',
    name: 'Physically Strong but Mentally Limited',
    nameZh: '身體強壯但心理受限',
    targetProfile:
      'Can climb hard in the gym but underperforms outdoors. Falls due to fear, poor focus, ' +
      'or inability to manage pressure on projects.',
    source: 'Horst "Training for Climbing" ch.2-3',
    emphasisSessionsPerWeek: 4,
    maintenanceSessionsPerWeek: 2,
    rotationWeeks: [4, 12],
    emphasisExerciseIds: [
      'mental_visualization',
      'mental_progressive_relaxation',
      'mental_self_assessment',
    ],
    maintenanceExerciseIds: [
      'hangboard_max_hangs',
      'endurance_4x4',
      'core_plank_training',
      'technique_varied_terrain',
    ],
    description:
      'Practice visualization before every climb, progressive relaxation daily. ' +
      'Regular self-assessment to track mental progress. ' +
      'Include deliberate exposure to fear-inducing situations (lead falls, outdoor climbing). ' +
      'Maintain physical training with 2 sessions/week.',
  },
  {
    id: 'sport_to_boulder_transition',
    name: 'Sport Climber Transitioning to Bouldering',
    nameZh: '從運動攀轉抱石',
    targetProfile:
      'Experienced route climber with good endurance who wants to improve bouldering. ' +
      'Needs more explosive power and max finger strength.',
    source: 'PMC study (2021) / Rucci conjugate method',
    emphasisSessionsPerWeek: 3,
    maintenanceSessionsPerWeek: 1,
    rotationWeeks: [3, 5],
    emphasisExerciseIds: [
      'hangboard_max_hangs',
      'hangboard_hit',
      'campus_bumps',
      'pullups_power',
      'lockoff_one_arm',
    ],
    maintenanceExerciseIds: ['endurance_arc', 'endurance_route_intervals'],
    description:
      'PMC study confirmed 5-week prioritization blocks are safe for intermediate-to-advanced ' +
      'climbers without decline in the non-prioritized discipline. ' +
      'Emphasize limit bouldering, max hangs, and power training 3x/week. ' +
      'Maintain route fitness with 1 endurance session.',
  },
  {
    id: 'boulder_to_sport_transition',
    name: 'Boulderer Transitioning to Sport Climbing',
    nameZh: '從抱石轉運動攀',
    targetProfile:
      'Strong boulderer who wants to improve route climbing. Burns creatine phosphate quickly ' +
      'and falls off routes without feeling pumped (fuel depletion, not pump).',
    source: 'Steve Maisch via TrainingBeta / PMC study (2021)',
    emphasisSessionsPerWeek: 3,
    maintenanceSessionsPerWeek: 2,
    rotationWeeks: [3, 5],
    emphasisExerciseIds: [
      'endurance_4x4',
      'endurance_route_intervals',
      'endurance_tabata',
      'endurance_arc',
      'endurance_fingerboard_moving_hangs',
    ],
    maintenanceExerciseIds: ['hangboard_max_hangs', 'pullups_hypergravity'],
    description:
      'The boulderer\'s conundrum: "climb up, don\'t feel pumped, just fall off" because ' +
      'creatine phosphate depletes in 12-15 seconds without aerobic backup. ' +
      'Train aerobic and anaerobic lactic systems 3x/week with intervals and ARC. ' +
      'Maintain finger strength with 1-2 hangboard sessions.',
  },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 依分類取得訓練動作 */
export function getExercisesByCategory(category: ExerciseCategory): readonly ExerciseProtocol[] {
  return EXERCISE_PROTOCOLS.filter((e) => e.category === category)
}

/** 依等級取得推薦訓練動作 */
export function getExercisesForLevel(level: TrainingLevel): readonly ExerciseProtocol[] {
  return EXERCISE_PROTOCOLS.filter((e) => e.recommendedLevels.includes(level))
}

/** 依 ID 取得訓練動作 */
export function getExerciseById(id: string): ExerciseProtocol | undefined {
  return EXERCISE_PROTOCOLS.find((e) => e.id === id)
}

/** 依等級取得建議的週期化模型 */
export function getPeriodizationForLevel(level: TrainingLevel): readonly PeriodizationModel[] {
  return PERIODIZATION_MODELS.filter((m) => m.recommendedLevels.includes(level))
}

/** 依等級取得弱點訓練模板 */
export function getAntiStyleForLevel(level: TrainingLevel): readonly AntiStyleTemplate[] {
  // All anti-style protocols are applicable to intermediate and advanced
  if (level === 'beginner') return []
  return ANTI_STYLE_PROTOCOLS
}
