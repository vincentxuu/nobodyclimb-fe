/**
 * 攀岩區域卡片組件
 *
 * 對應 apps/web/src/components/crag/area-section.tsx 中的區域卡片
 */
import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { ChevronRight } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface AreaCardProps {
  id: string
  name: string
  description?: string
  difficulty?: string
  routesCount: number
  image?: string
  onPress?: () => void
}

export function AreaCard({
  name,
  description,
  difficulty,
  routesCount,
  image,
  onPress,
}: AreaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* 背景圖 */}
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={['#8B7355', '#5D4E37']}
            style={styles.placeholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={styles.gradient}
        />
      </View>

      {/* 內容 */}
      <View style={styles.content}>
        <View style={styles.mainContent}>
          <Text variant="body" fontWeight="600" numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            {difficulty && (
              <Text variant="caption" color="textMuted">
                {difficulty}
              </Text>
            )}
            {difficulty && routesCount > 0 && (
              <Text variant="caption" color="textMuted">
                {' · '}
              </Text>
            )}
            <Text variant="caption" color="textMuted">
              {routesCount} 條路線
            </Text>
          </View>
          {description && (
            <Text variant="small" color="textSubtle" numberOfLines={2} style={styles.description}>
              {description}
            </Text>
          )}
        </View>
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEAEA',
  },
  pressed: {
    borderColor: '#FFE70C',
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    height: 80,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  mainContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  description: {
    marginTop: 4,
  },
})
