/**
 * 攀岩等級系統型別定義
 */

export type RankId = 'foothill' | 'wall' | 'ridge' | 'summit'

export interface ClimberRank {
  id: RankId
  name: string
  display_name: string
  min_score: number
  daily_ai_limit: number
  color: string
  description?: string
}

export interface UserRank {
  user_id: string
  score: number
  rank_id: RankId
  daily_ai_used: number
  daily_ai_limit: number
  daily_token_used: number
  daily_token_limit: number
  last_reset_date: string
  last_score_calculated_at: string
  rank_override_id: RankId | null
}

export interface AiQuota {
  tier: RankId
  tier_display: string
  daily_limit: number
  daily_used: number
  remaining: number
  score: number
  resets_at: string
  token_limit: number
  token_used: number
  token_remaining: number
}

export interface AiQuotaExceeded {
  error: 'quota_exceeded'
  tier: RankId
  tier_display: string
  daily_limit: number
  daily_used: number
  resets_at: string
}

/** 管理員查詢用戶等級時的積分明細 */
export interface RankScoreBreakdown {
  biography_fields: number
  biography_bucket_list: number
  biography_public: number
  core_stories: number
  one_liners: number
  stories: number
  route_ascents: number
  bucket_list_items: number
  bucket_list_completed: number
  quiz_completed: number
  training_completed: number
  total: number
}

export interface UserRankDetail extends UserRank {
  rank_display_name: string
  score_breakdown: RankScoreBreakdown
}
