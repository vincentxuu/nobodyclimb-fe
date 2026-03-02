/**
 * SocialLinks 組件
 *
 * 社群連結，對應 apps/web/src/components/biography/social-links.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, Linking, type ViewStyle } from 'react-native'
import { Instagram, Youtube, ExternalLink } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { Text } from '@/components/ui'
import { SPACING, RADIUS } from '@nobodyclimb/constants'

interface BiographySocialLinks {
  instagram?: string
  youtube_channel?: string
  youtube?: string
}

interface SocialLinksSectionProps {
  socialLinks: BiographySocialLinks | null
  style?: ViewStyle
}

/**
 * 社群連結區塊
 */
export function SocialLinksSection({ socialLinks, style }: SocialLinksSectionProps) {
  if (!socialLinks) return null

  const { instagram, youtube_channel, youtube } = socialLinks
  const youtubeHandle = youtube_channel || youtube

  if (!instagram && !youtubeHandle) return null

  const openInstagram = () => {
    if (instagram) {
      Linking.openURL(`https://instagram.com/${instagram}`)
    }
  }

  const openYouTube = () => {
    if (youtubeHandle) {
      Linking.openURL(getYouTubeChannelUrl(youtubeHandle))
    }
  }

  return (
    <View style={[styles.container, style]}>
      {instagram && (
        <Pressable onPress={openInstagram}>
          <LinearGradient
            colors={['#833AB4', '#E1306C', '#F77737']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.instagramButton}
          >
            <Instagram size={16} color="#fff" />
            <Text style={styles.buttonText}>@{instagram}</Text>
            <ExternalLink size={12} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>
      )}

      {youtubeHandle && (
        <Pressable style={styles.youtubeButton} onPress={openYouTube}>
          <Youtube size={16} color="#fff" />
          <Text style={styles.buttonText}>{formatYouTubeHandle(youtubeHandle)}</Text>
          <ExternalLink size={12} color="rgba(255,255,255,0.7)" />
        </Pressable>
      )}
    </View>
  )
}

/**
 * 緊湊版社群連結
 */
interface CompactSocialLinksProps {
  socialLinks: BiographySocialLinks | null
  style?: ViewStyle
}

export function CompactSocialLinks({ socialLinks, style }: CompactSocialLinksProps) {
  if (!socialLinks) return null

  const { instagram, youtube_channel, youtube } = socialLinks
  const youtubeHandle = youtube_channel || youtube

  if (!instagram && !youtubeHandle) return null

  const openInstagram = () => {
    if (instagram) {
      Linking.openURL(`https://instagram.com/${instagram}`)
    }
  }

  const openYouTube = () => {
    if (youtubeHandle) {
      Linking.openURL(getYouTubeChannelUrl(youtubeHandle))
    }
  }

  return (
    <View style={[styles.compactContainer, style]}>
      {instagram && (
        <Pressable onPress={openInstagram}>
          <LinearGradient
            colors={['#833AB4', '#E1306C', '#F77737']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.compactButton}
          >
            <Instagram size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}

      {youtubeHandle && (
        <Pressable style={styles.compactYoutubeButton} onPress={openYouTube}>
          <Youtube size={16} color="#fff" />
        </Pressable>
      )}
    </View>
  )
}

// Helper functions
function getYouTubeChannelUrl(channel: string): string {
  if (channel.startsWith('@')) {
    return `https://youtube.com/${channel}`
  }
  if (channel.startsWith('UC')) {
    return `https://youtube.com/channel/${channel}`
  }
  return `https://youtube.com/@${channel}`
}

function formatYouTubeHandle(channel: string): string {
  if (channel.startsWith('@')) {
    return channel
  }
  if (channel.startsWith('UC')) {
    return 'YouTube'
  }
  return `@${channel}`
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  instagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  compactButton: {
    padding: SPACING.sm,
    borderRadius: 999,
  },
  compactYoutubeButton: {
    padding: SPACING.sm,
    borderRadius: 999,
    backgroundColor: '#DC2626',
  },
})

export default SocialLinksSection
