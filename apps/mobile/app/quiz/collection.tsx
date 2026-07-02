/**
 * 8 種攀岩人格收藏集
 *
 * 對應 apps/web/src/app/[locale]/quiz/collection/page.tsx
 */

import { PERSONALITY_TYPES, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CollectionCard } from '@/components/quiz/CollectionCard'
import { IconButton, Text } from '@/components/ui'

export default function QuizCollectionScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            icon={ChevronLeft}
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="返回"
          />
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.titleSection}>
          <Text variant="h2" fontWeight="700" style={styles.title}>
            8 種攀岩人格
          </Text>
          <Text variant="body" color="textSubtle" style={styles.subtitle}>
            探索每種攀岩人格的特質與風格
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {PERSONALITY_TYPES.map((type, index) => (
            <Animated.View
              key={type.code}
              entering={FadeInDown.duration(300).delay(100 + index * 50)}
              style={styles.gridItem}
            >
              <CollectionCard personality={type} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING[10],
  },
  header: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
  },
  titleSection: {
    paddingHorizontal: SPACING[6],
    paddingBottom: SPACING[6],
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  subtitle: {
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  gridItem: {
    width: '47.5%',
  },
})
