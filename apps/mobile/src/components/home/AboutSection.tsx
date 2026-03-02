/**
 * AboutSection 組件
 *
 * 關於小人物攀岩區塊，對應 apps/web/src/components/home/about-section.tsx
 */
import React from 'react'
import { StyleSheet, View, Image } from 'react-native'
import { YStack } from 'tamagui'
import { useRouter } from 'expo-router'

import { Text, Button } from '@/components/ui'
import { FadeIn } from '@/components/animation'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING, BRAND_YELLOW } from '@nobodyclimb/constants'

export function AboutSection() {
  const router = useRouter()
  const status = useAuthStore((state) => state.status)
  const isAuthenticated = status === 'signIn'

  const handleAboutPress = () => {
    router.push('/about')
  }

  const handleRegisterPress = () => {
    router.push('/auth/register')
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        {/* 背景漸層 */}
        <View style={styles.gradient} />

        {/* 內容區域 */}
        <YStack style={styles.content} alignItems="center" justifyContent="center">
          {/* Logo */}
          <Image
            source={require('../../../assets/logo-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* 分隔線 */}
          <View style={styles.divider} />

          {/* 說明文字 */}
          <Text style={styles.description}>
            緣起於一個 Nobody 很熱愛這項運動，期待更多 Nobody 能一起 Climb
          </Text>

          {/* 按鈕區 */}
          <YStack gap={SPACING[3]} style={styles.buttonContainer}>
            <Button
              variant="secondary"
              size="lg"
              onPress={handleAboutPress}
              fullWidth
            >
              認識小人物
            </Button>

            {!isAuthenticated && (
              <Button
                variant="primary"
                size="lg"
                onPress={handleRegisterPress}
                fullWidth
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>成為小人物</Text>
              </Button>
            )}
          </YStack>
        </YStack>
      </View>
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 400,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[12],
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 80,
    marginBottom: SPACING[6],
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
    marginVertical: SPACING[2],
  },
  description: {
    marginTop: SPACING[4],
    fontSize: 16,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    paddingHorizontal: SPACING[4],
  },
  buttonContainer: {
    marginTop: SPACING[8],
    width: '100%',
    maxWidth: 300,
  },
  registerButton: {
    backgroundColor: `${BRAND_YELLOW[100]}90`,
  },
  registerButtonText: {
    color: SEMANTIC_COLORS.textMain,
    fontWeight: '500',
  },
})

export default AboutSection
