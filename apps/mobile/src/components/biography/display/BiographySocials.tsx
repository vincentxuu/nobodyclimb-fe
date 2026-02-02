/**
 * BiographySocials 組件
 *
 * 社群連結展示，對應 apps/web/src/components/biography/display/BiographySocials.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { Link2, Globe } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface SocialLinks {
  instagram?: string
  youtube?: string
  facebook?: string
  threads?: string
  website?: string
}

interface BiographyV2 {
  id: string
  social_links?: SocialLinks
  [key: string]: any
}

interface BiographySocialsProps {
  biography: BiographyV2
}

// 社群平台名稱
const SocialNames: Record<keyof SocialLinks, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  threads: 'Threads',
  website: '個人網站',
}

// 建立社群連結 URL
function getSocialUrl(platform: keyof SocialLinks, value: string): string {
  switch (platform) {
    case 'instagram':
      return value.startsWith('http')
        ? value
        : `https://instagram.com/${value.replace('@', '')}`
    case 'youtube':
      return value.startsWith('http')
        ? value
        : `https://youtube.com/@${value.replace('@', '')}`
    case 'facebook':
      return value.startsWith('http') ? value : `https://facebook.com/${value}`
    case 'threads':
      return value.startsWith('http')
        ? value
        : `https://threads.net/@${value.replace('@', '')}`
    case 'website':
      return value.startsWith('http') ? value : `https://${value}`
    default:
      return value
  }
}

// Instagram 圖標
function InstagramIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={SEMANTIC_COLORS.textSubtle}>
      <Path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </Svg>
  )
}

// YouTube 圖標
function YouTubeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={SEMANTIC_COLORS.textSubtle}>
      <Path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </Svg>
  )
}

// Facebook 圖標
function FacebookIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={SEMANTIC_COLORS.textSubtle}>
      <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  )
}

// Threads 圖標
function ThreadsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={SEMANTIC_COLORS.textSubtle}>
      <Path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 1.076-.007 2.097-.137 3.035-.388 2.272-.607 4.034-1.834 5.24-3.65.734-1.105 1.165-2.22 1.317-3.412.064-.505.058-1.017-.02-1.524-.136-.886-.474-1.653-1.047-2.362-.573-.71-1.298-1.253-2.164-1.618-.867-.366-1.833-.551-2.877-.551-.7 0-1.297.07-1.776.208-.52.151-.967.377-1.332.674-.371.301-.649.653-.83 1.048-.16.349-.242.699-.241 1.04.001.193.02.378.055.557.108.545.347 1.021.715 1.42.381.413.875.731 1.472.947.556.2 1.15.306 1.766.315.74-.007 1.399-.124 1.96-.347.46-.182.866-.444 1.211-.779.345-.336.619-.734.816-1.184.133-.301.229-.614.288-.935l2.006.46c-.102.519-.272 1.023-.508 1.506-.355.727-.824 1.37-1.398 1.914-.573.544-1.253.967-2.024 1.26-.815.31-1.735.474-2.737.487h-.062c-.817-.009-1.615-.133-2.372-.37-.812-.253-1.537-.633-2.155-1.13-.628-.505-1.143-1.133-1.53-1.869-.395-.751-.609-1.592-.637-2.498v-.006c.026-.7.158-1.354.395-1.95.237-.596.564-1.127.976-1.58.412-.453.907-.832 1.474-1.129.567-.297 1.19-.504 1.855-.616.664-.112 1.362-.154 2.076-.126 1.299.051 2.506.299 3.588.737 1.082.438 2.015 1.078 2.77 1.902.755.824 1.303 1.814 1.628 2.94.17.588.267 1.2.29 1.82.033.885-.113 1.76-.434 2.6-.32.84-.785 1.62-1.381 2.32-1.42 1.669-3.518 2.772-6.239 3.28-1.071.2-2.212.304-3.396.309z" />
    </Svg>
  )
}

// 社群平台圖標映射
const SocialIconComponents: Record<keyof SocialLinks, React.ReactNode> = {
  instagram: <InstagramIcon />,
  youtube: <YouTubeIcon />,
  facebook: <FacebookIcon />,
  threads: <ThreadsIcon />,
  website: <Globe size={20} color={SEMANTIC_COLORS.textSubtle} />,
}

/**
 * 社群連結展示組件
 */
export function BiographySocials({ biography }: BiographySocialsProps) {
  const socialLinks = biography.social_links

  if (!socialLinks) {
    return null
  }

  // 過濾出有值的社群連結
  const activeSocials = (
    Object.entries(socialLinks) as [keyof SocialLinks, string | undefined][]
  ).filter(([_, value]) => value && value.trim() !== '')

  if (activeSocials.length === 0) {
    return null
  }

  const handlePress = async (platform: keyof SocialLinks, value: string) => {
    const url = getSocialUrl(platform, value)
    try {
      await Linking.openURL(url)
    } catch (error) {
      console.error('Failed to open URL:', error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Link2 size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="body" fontWeight="600">
          找到我
        </Text>
      </View>

      <View style={styles.linksContainer}>
        {activeSocials.map(([platform, value]) => (
          <Pressable
            key={platform}
            style={styles.linkButton}
            onPress={() => handlePress(platform, value!)}
          >
            {SocialIconComponents[platform]}
            <Text variant="small" fontWeight="500" color="textSubtle">
              {SocialNames[platform]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#DBD8D8',
    backgroundColor: '#fff',
  },
})

export default BiographySocials
