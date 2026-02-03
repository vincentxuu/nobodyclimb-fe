import 'react-native-reanimated'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { Providers } from '@/providers'

export default function RootLayout() {
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
