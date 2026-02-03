/**
 * 岩場卡片組件
 *
 * 對應 apps/web/src/app/crag/page.tsx 中的 CragCard
 */
import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { MapPin, Mountain, Calendar, ChevronRight } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Badge } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface CragCardProps {
  id: string
  name: string
  nameEn: string
  location: string
  type: string
  rockType: string
  routes: number
  difficulty: string
  seasons: string[]
  image?: string
  onPress?: () => void
  index?: number
}

export function CragCard({
  name,
  nameEn,
  location,
  type,
  rockType,
  routes,
  difficulty,
  seasons,
  image,
  onPress,
  index = 0,
}: CragCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        {/* 封面圖 */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={['#8B7355', '#5D4E37']}
              style={styles.placeholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          {/* 類型標籤 */}
          <View style={styles.typeTag}>
            <Text variant="caption" style={styles.typeText}>
              {rockType}
            </Text>
          </View>
        </View>

        {/* 內容區 */}
        <View style={styles.content}>
          {/* 標題 */}
          <View style={styles.titleRow}>
            <Text variant="body" fontWeight="600">
              {name}
            </Text>
            <Text variant="caption" color="textMuted" style={styles.nameEn}>
              {nameEn}
            </Text>
          </View>

          {/* 位置 */}
          <View style={styles.locationRow}>
            <MapPin size={14} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted" numberOfLines={1}>
              {location}
            </Text>
          </View>

          {/* 資訊行 */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Mountain size={14} color={SEMANTIC_COLORS.textSubtle} />
              <Text variant="small" color="textSubtle">
                {routes} 條路線
              </Text>
            </View>
            <Text variant="small" color="textMuted">
              {difficulty}
            </Text>
          </View>

          {/* 季節標籤 */}
          <View style={styles.seasonRow}>
            <Calendar size={14} color={SEMANTIC_COLORS.textMuted} />
            <View style={styles.seasonTags}>
              {seasons.map((season) => (
                <View key={season} style={styles.seasonTag}>
                  <Text variant="caption" style={styles.seasonText}>
                    {season}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 箭頭 */}
        <View style={styles.arrowContainer}>
          <ChevronRight size={20} color={SEMANTIC_COLORS.textMuted} />
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pressed: {
    backgroundColor: '#FAFAFA',
    transform: [{ translateY: -1 }],
  },
  imageContainer: {
    width: 100,
    height: 120,
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
  typeTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(27, 26, 26, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  nameEn: {
    fontSize: 11,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seasonTags: {
    flexDirection: 'row',
    gap: 4,
  },
  seasonTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  seasonText: {
    fontSize: 10,
    color: SEMANTIC_COLORS.textSubtle,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingRight: SPACING.sm,
  },
})
