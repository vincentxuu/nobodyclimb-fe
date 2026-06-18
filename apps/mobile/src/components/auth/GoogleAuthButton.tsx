import * as Google from 'expo-auth-session/providers/google'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Button, Text } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_CLIENT_ID
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_CLIENT_ID
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_CLIENT_ID

const isGoogleAuthConfigured = Boolean(
  GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID
)

export const GOOGLE_AUTH_CONFIGURED = isGoogleAuthConfigured

interface GoogleAuthButtonProps {
  mode: 'login' | 'register'
  onError: (message: string) => void
}

export function GoogleAuthButton({ mode, onError }: GoogleAuthButtonProps) {
  if (!isGoogleAuthConfigured) return null

  return <ConfiguredGoogleAuthButton mode={mode} onError={onError} />
}

function ConfiguredGoogleAuthButton({ mode, onError }: GoogleAuthButtonProps) {
  const router = useRouter()
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const authLoading = useAuthStore((state) => state.isLoading)
  const [isPrompting, setIsPrompting] = useState(false)
  const handledCredentialRef = useRef<string | null>(null)

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID || undefined,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  })

  useEffect(() => {
    if (!response) return

    if (response.type !== 'success') {
      if (response.type === 'error') {
        onError(mode === 'login' ? 'Google 登入失敗，請稍後再試' : 'Google 註冊失敗，請稍後再試')
      }
      setIsPrompting(false)
      return
    }

    const credential = response.params.id_token || response.authentication?.idToken
    if (!credential) {
      onError('無法取得 Google 認證資訊')
      setIsPrompting(false)
      return
    }

    if (handledCredentialRef.current === credential) return
    handledCredentialRef.current = credential

    signInWithGoogle(credential)
      .then(({ isNewUser }) => {
        router.replace(isNewUser ? '/auth/profile-setup/basic-info' : '/')
      })
      .catch((error) => {
        onError(error instanceof Error ? error.message : 'Google 登入失敗，請稍後再試')
      })
      .finally(() => {
        setIsPrompting(false)
      })
  }, [mode, onError, response, router, signInWithGoogle])

  const handlePress = useCallback(async () => {
    if (!request) {
      onError('Google 登入尚未準備完成，請稍後再試')
      return
    }

    setIsPrompting(true)
    try {
      await promptAsync()
    } catch (error) {
      setIsPrompting(false)
      onError(error instanceof Error ? error.message : 'Google 登入失敗，請稍後再試')
    }
  }, [onError, promptAsync, request])

  const loading = authLoading || isPrompting

  return (
    <Button
      variant="secondary"
      onPress={handlePress}
      disabled={!request || loading}
      loading={loading}
      style={styles.button}
    >
      <Text>{mode === 'login' ? '使用 Google 登入' : '使用 Google 註冊'}</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
  },
})
