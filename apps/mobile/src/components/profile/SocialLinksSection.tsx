import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Input } from '../ui/Input'
import { Icon } from '../ui/Icon'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'
import { SocialLinks } from './types'
import { COLORS } from '@nobodyclimb/constants'

interface SocialLinksSectionProps {
  socialLinks: SocialLinks
  isEditing: boolean
  isMobile?: boolean
  onChange: (field: string, value: SocialLinks) => void
}

export default function SocialLinksSection({
  socialLinks,
  isEditing,
  onChange,
}: SocialLinksSectionProps) {
  const handleChange = (field: keyof SocialLinks, value: string) => {
    onChange('socialLinks', {
      ...socialLinks,
      [field]: value,
    })
  }

  return (
    <View style={styles.container}>
      <ProfileFormField
        label={
          <View style={styles.labelRow}>
            <Icon name="Instagram" size="sm" color={COLORS.gray[600]} />
            <View style={{ marginLeft: 8 }}>
              <View style={styles.labelText}>Instagram</View>
            </View>
          </View>
        }
        hint="填入你的 Instagram 用戶名"
      >
        {isEditing ? (
          <Input
            value={socialLinks.instagram}
            onChangeText={(text) => handleChange('instagram', text)}
            placeholder="你的 Instagram 用戶名"
            leftIcon={<Icon name="AtSign" size="sm" color={COLORS.gray[400]} />}
          />
        ) : (
          <ProfileTextDisplay
            text={socialLinks.instagram ? `@${socialLinks.instagram}` : '未設定'}
          />
        )}
      </ProfileFormField>
      <ProfileFormField
        label={
          <View style={styles.labelRow}>
            <Icon name="Youtube" size="sm" color={COLORS.gray[600]} />
            <View style={{ marginLeft: 8 }}>
              <View style={styles.labelText}>YouTube</View>
            </View>
          </View>
        }
        hint="填入你的 YouTube 頻道網址"
      >
        {isEditing ? (
          <Input
            value={socialLinks.youtube_channel}
            onChangeText={(text) => handleChange('youtube_channel', text)}
            placeholder="https://youtube.com/@your-channel"
          />
        ) : (
          <ProfileTextDisplay
            text={socialLinks.youtube_channel || '未設定'}
          />
        )}
      </ProfileFormField>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontWeight: '500',
    fontSize: 14,
  },
})
