import 'react-native-reanimated'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { useFonts } from 'expo-font'
import { useEffect } from 'react'
import * as SplashScreen from 'expo-splash-screen'
import { Providers } from '@/providers'

// 保持 Splash Screen 顯示直到字體載入完成
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // TODO: Replace GlowSansTC placeholder with actual font file:
  // - GlowSansTC: download from https://github.com/ooookai/Glow-Sans/releases
  //   Copy the TC Regular .otf/.ttf to apps/mobile/assets/fonts/GlowSansTC-Regular.otf
  //   and remove this comment.
  const [fontsLoaded] = useFonts({
    'NotoSansTC-Regular': require('../assets/fonts/NotoSansTC-Regular.ttf'),
    'NotoSansTC-Medium': require('../assets/fonts/NotoSansTC-Medium.ttf'),
    'NotoSansTC-Bold': require('../assets/fonts/NotoSansTC-Bold.ttf'),
    'GlowSansTC-Regular': require('../assets/fonts/GlowSansTC-Regular.otf'), // placeholder - see TODO above
    'AllertaStencil-Regular': require('../assets/fonts/AllertaStencil-Regular.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={styles.container}>
      <Providers>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <StatusBar style="auto" />
      </Providers>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
