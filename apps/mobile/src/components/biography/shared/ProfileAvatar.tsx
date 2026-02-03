/**
 * ProfileAvatar 組件
 *
 * 傳記頁面頭像組件，支援像素大小
 */
import React, { useState } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { User } from 'lucide-react-native'
import { WB_COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

export interface ProfileAvatarProps {
  /** 圖片來源 URL */
  src?: string
  /** 名字（用於 fallback） */
  name?: string
  /** 尺寸（像素） */
  size?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 傳記頁面頭像組件
 */
export function ProfileAvatar({
  src,
  name,
  size = 80,
  style,
}: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const showFallback = !src || hasError

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {showFallback ? (
        <View style={[styles.fallback, { borderRadius: size / 2 }]}>
          <User size={size * 0.5} color={SEMANTIC_COLORS.textMuted} />
        </View>
      ) : (
        <Image
          source={{ uri: src }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          contentFit="cover"
          transition={200}
          onError={() => setHasError(true)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: WB_COLORS[0],
    backgroundColor: WB_COLORS[0],
  },
  image: {
    backgroundColor: WB_COLORS[20],
  },
  fallback: {
    flex: 1,
    backgroundColor: WB_COLORS[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default ProfileAvatar
