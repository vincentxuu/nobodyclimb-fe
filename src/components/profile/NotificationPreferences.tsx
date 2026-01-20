'use client'

import { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { notificationService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'

interface NotificationPreferencesState {
  goal_liked: boolean
  goal_commented: boolean
  goal_referenced: boolean
  post_liked: boolean
  post_commented: boolean
  biography_commented: boolean
  new_follower: boolean
  story_featured: boolean
  goal_completed: boolean
  email_digest: boolean
}

const defaultPreferences: NotificationPreferencesState = {
  goal_liked: true,
  goal_commented: true,
  goal_referenced: true,
  post_liked: true,
  post_commented: true,
  biography_commented: true,
  new_follower: true,
  story_featured: true,
  goal_completed: true,
  email_digest: false,
}

interface PreferenceItemProps {
  id: keyof NotificationPreferencesState
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (id: keyof NotificationPreferencesState, checked: boolean) => void
}

function PreferenceItem({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: PreferenceItemProps) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1 pr-4">
        <Label htmlFor={id} className="text-sm font-medium text-[#3F3D3D] cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-[#8E8C8C] mt-0.5">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(id, value)}
      />
    </div>
  )
}

interface PreferenceSectionProps {
  title: string
  children: React.ReactNode
}

function PreferenceSection({ title, children }: PreferenceSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-[#1B1A1A] uppercase tracking-wide">{title}</h3>
      <div className="divide-y divide-[#EBEAEA]">{children}</div>
    </div>
  )
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesState>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const [savingKeys, setSavingKeys] = useState<Set<keyof NotificationPreferencesState>>(new Set())
  const { toast } = useToast()

  // 載入偏好設定
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await notificationService.getPreferences()
        if (response.success && response.data) {
          setPreferences(response.data)
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
        toast({
          title: '載入失敗',
          description: '無法載入通知偏好設定',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [toast])

  // 更新單個偏好設定
  const handlePreferenceChange = useCallback(
    async (key: keyof NotificationPreferencesState, value: boolean) => {
      // 樂觀更新 UI
      setPreferences((prev) => ({ ...prev, [key]: value }))
      setSavingKeys((prev) => new Set(prev).add(key))

      try {
        const response = await notificationService.updatePreferences({ [key]: value })
        if (!response.success) {
          // 回滾
          setPreferences((prev) => ({ ...prev, [key]: !value }))
          toast({
            title: '更新失敗',
            description: '無法更新偏好設定',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Failed to update preference:', error)
        // 回滾
        setPreferences((prev) => ({ ...prev, [key]: !value }))
        toast({
          title: '更新失敗',
          description: '無法更新偏好設定',
          variant: 'destructive',
        })
      } finally {
        setSavingKeys((prev) => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
      }
    },
    [toast]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6D6C6C]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 互動通知 */}
      <PreferenceSection title="互動通知">
        <PreferenceItem
          id="goal_liked"
          label="目標被按讚"
          description="當有人對你的攀岩目標按讚時通知你"
          checked={preferences.goal_liked}
          disabled={savingKeys.has('goal_liked')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="goal_commented"
          label="目標被留言"
          description="當有人在你的攀岩目標留言時通知你"
          checked={preferences.goal_commented}
          disabled={savingKeys.has('goal_commented')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="goal_referenced"
          label="目標被引用"
          description="當有人將你的目標加入他們的清單時通知你"
          checked={preferences.goal_referenced}
          disabled={savingKeys.has('goal_referenced')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="post_liked"
          label="文章被按讚"
          description="當有人對你的文章按讚時通知你"
          checked={preferences.post_liked}
          disabled={savingKeys.has('post_liked')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="post_commented"
          label="文章被留言"
          description="當有人在你的文章留言時通知你"
          checked={preferences.post_commented}
          disabled={savingKeys.has('post_commented')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="biography_commented"
          label="人物誌被留言"
          description="當有人在你管理的人物誌留言時通知你"
          checked={preferences.biography_commented}
          disabled={savingKeys.has('biography_commented')}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>

      {/* 社交通知 */}
      <PreferenceSection title="社交通知">
        <PreferenceItem
          id="new_follower"
          label="新追蹤者"
          description="當有人追蹤你時通知你"
          checked={preferences.new_follower}
          disabled={savingKeys.has('new_follower')}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>

      {/* 系統通知 */}
      <PreferenceSection title="系統通知">
        <PreferenceItem
          id="goal_completed"
          label="目標完成"
          description="當你完成一個攀岩目標時收到祝賀通知"
          checked={preferences.goal_completed}
          disabled={savingKeys.has('goal_completed')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="story_featured"
          label="故事被精選"
          description="當你的故事被編輯精選時通知你"
          checked={preferences.story_featured}
          disabled={savingKeys.has('story_featured')}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>

      {/* Email 通知 */}
      <PreferenceSection title="電子郵件">
        <PreferenceItem
          id="email_digest"
          label="每日摘要"
          description="每天收到一封包含所有通知的摘要郵件（開發中）"
          checked={preferences.email_digest}
          disabled={true}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>
    </div>
  )
}
