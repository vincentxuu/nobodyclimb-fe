'use client'

import { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { notificationService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { useTranslations } from 'next-intl'

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
  onCheckedChange: (_id: keyof NotificationPreferencesState, _checked: boolean) => void
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
  const t = useTranslations('ProfilePage')
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
          title: t('toastLoadFailed'),
          description: t('toastLoadNotifPrefsFailedDesc'),
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
            title: t('toastUpdateFailed'),
            description: t('toastUpdateNotifPrefsFailedDesc'),
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Failed to update preference:', error)
        // 回滾
        setPreferences((prev) => ({ ...prev, [key]: !value }))
        toast({
          title: t('toastUpdateFailed'),
          description: t('toastUpdateNotifPrefsFailedDesc'),
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
      <PreferenceSection title={t('notifSectionInteraction')}>
        <PreferenceItem
          id="goal_liked"
          label={t('notifGoalLiked')}
          description={t('notifGoalLikedDesc')}
          checked={preferences.goal_liked}
          disabled={savingKeys.has('goal_liked')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="goal_commented"
          label={t('notifGoalCommented')}
          description={t('notifGoalCommentedDesc')}
          checked={preferences.goal_commented}
          disabled={savingKeys.has('goal_commented')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="goal_referenced"
          label={t('notifGoalReferenced')}
          description={t('notifGoalReferencedDesc')}
          checked={preferences.goal_referenced}
          disabled={savingKeys.has('goal_referenced')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="post_liked"
          label={t('notifPostLiked')}
          description={t('notifPostLikedDesc')}
          checked={preferences.post_liked}
          disabled={savingKeys.has('post_liked')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="post_commented"
          label={t('notifPostCommented')}
          description={t('notifPostCommentedDesc')}
          checked={preferences.post_commented}
          disabled={savingKeys.has('post_commented')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="biography_commented"
          label={t('notifBiographyCommented')}
          description={t('notifBiographyCommentedDesc')}
          checked={preferences.biography_commented}
          disabled={savingKeys.has('biography_commented')}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>

      {/* 社交通知 */}
      <PreferenceSection title={t('notifSectionSocial')}>
        <PreferenceItem
          id="new_follower"
          label={t('notifNewFollower')}
          description={t('notifNewFollowerDesc')}
          checked={preferences.new_follower}
          disabled={savingKeys.has('new_follower')}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>

      {/* 系統通知 */}
      <PreferenceSection title={t('notifSectionSystem')}>
        <PreferenceItem
          id="goal_completed"
          label={t('notifGoalCompleted')}
          description={t('notifGoalCompletedDesc')}
          checked={preferences.goal_completed}
          disabled={savingKeys.has('goal_completed')}
          onCheckedChange={handlePreferenceChange}
        />
        <PreferenceItem
          id="story_featured"
          label={t('notifStoryFeatured')}
          description={t('notifStoryFeaturedDesc')}
          checked={preferences.story_featured}
          disabled={savingKeys.has('story_featured')}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>

      {/* Email 通知 */}
      <PreferenceSection title={t('notifSectionEmail')}>
        <PreferenceItem
          id="email_digest"
          label={t('notifEmailDigest')}
          description={t('notifEmailDigestDesc')}
          checked={preferences.email_digest}
          disabled={true}
          onCheckedChange={handlePreferenceChange}
        />
      </PreferenceSection>
    </div>
  )
}
