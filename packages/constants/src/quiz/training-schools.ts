import type { PersonalityTypeCode } from '@nobodyclimb/types'

export interface TrainingSchoolMapping {
  typeCode: PersonalityTypeCode
  trainingSchool: string
  trainingSchoolZh: string
  schoolDescription: string
  antiStyleProtocolId: string
  adjustableFields: string[]
  fixedFields: string[]
}

const ADJUSTABLE_FIELDS = [
  'exercises.sets',
  'exercises.reps',
  'exercises.notes',
  'duration',
  'description',
  'exercises.name',
] as const

const FIXED_FIELDS = [
  'weeks[].theme',
  'days[].dayNumber',
  'exercises.length',
  'weekNumber',
] as const

export const TRAINING_SCHOOL_MAPPINGS: Record<PersonalityTypeCode, TrainingSchoolMapping> = {
  PGB: {
    typeCode: 'PGB',
    trainingSchool: 'MacLeod / Climbing Bible',
    trainingSchoolZh: 'MacLeod / Climbing Bible 技巧章節',
    schoolDescription:
      'Dave MacLeod 的自我教練法搭配 Climbing Bible 技巧章節，強調力量型攀岩者補足技術短板',
    antiStyleProtocolId: 'power_climber_needs_endurance',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  PGS: {
    typeCode: 'PGS',
    trainingSchool: 'Anderson Brothers',
    trainingSchoolZh: 'Anderson 嚴格週期化訓練',
    schoolDescription:
      'Anderson Brothers 的嚴格週期化訓練法，適合有紀律的力量型攀岩者建立結構化進步',
    antiStyleProtocolId: 'endurance_climber_needs_power',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  PFB: {
    typeCode: 'PFB',
    trainingSchool: 'Steve Bechtel / Climb Strong',
    trainingSchoolZh: 'Bechtel 非線性週期化訓練',
    schoolDescription: 'Steve Bechtel 的非線性週期化訓練法，適合熱情奔放的攀岩者保持多元訓練刺激',
    antiStyleProtocolId: 'strong_climber_weak_technique',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  PFS: {
    typeCode: 'PFS',
    trainingSchool: 'Eric Horst',
    trainingSchoolZh: 'Horst 工具箱與目標設定',
    schoolDescription: 'Eric Horst 的訓練工具箱搭配目標設定法，幫助穩定型攀岩者找到突破方向',
    antiStyleProtocolId: 'mental_weakness',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  TGB: {
    typeCode: 'TGB',
    trainingSchool: 'Beastmaking / Ned Feehally',
    trainingSchoolZh: 'Beastmaking 指力訓練 + 力量補充',
    schoolDescription:
      'Ned Feehally 的 Beastmaking 指力訓練法搭配力量補充計畫，強化技巧型攀岩者的身體素質',
    antiStyleProtocolId: 'sport_to_boulder_transition',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  TGS: {
    typeCode: 'TGS',
    trainingSchool: 'Climbing Bible / Strong Mind',
    trainingSchoolZh: 'Climbing Bible + Strong Mind 心理訓練',
    schoolDescription: 'Climbing Bible 的系統化技術訓練搭配 Strong Mind 心理建設，適合分析型攀岩者',
    antiStyleProtocolId: 'strong_climber_weak_technique',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  TFB: {
    typeCode: 'TFB',
    trainingSchool: '日本學派（チバトレ）',
    trainingSchoolZh: '日本學派 チバトレ 身體感知訓練',
    schoolDescription: '日本學派的チバトレ（千葉訓練）身體感知訓練法，強調身體意識與動作品質',
    antiStyleProtocolId: 'boulder_to_sport_transition',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
  TFS: {
    typeCode: 'TFS',
    trainingSchool: 'Anderson Brothers',
    trainingSchoolZh: 'Anderson 結構化訓練突破舒適圈',
    schoolDescription: 'Anderson Brothers 的結構化訓練法，用明確的架構幫助禪者型攀岩者跳出舒適圈',
    antiStyleProtocolId: 'mental_weakness',
    adjustableFields: [...ADJUSTABLE_FIELDS],
    fixedFields: [...FIXED_FIELDS],
  },
}

export function getTrainingSchoolMapping(typeCode: PersonalityTypeCode): TrainingSchoolMapping {
  return TRAINING_SCHOOL_MAPPINGS[typeCode]
}
