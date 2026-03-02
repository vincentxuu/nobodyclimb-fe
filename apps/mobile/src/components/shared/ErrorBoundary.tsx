/**
 * ErrorBoundary 組件
 *
 * 錯誤邊界，捕獲子組件的錯誤並顯示友好的錯誤頁面
 */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { YStack } from 'tamagui'
import { AlertTriangle, RefreshCw } from 'lucide-react-native'

import { Text, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

interface Props {
  children: ReactNode
  /** 自訂錯誤 UI */
  fallback?: ReactNode
  /** 錯誤發生時的回調 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View style={styles.container}>
          <YStack alignItems="center" gap={SPACING.md}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={48} color="#EF4444" />
            </View>
            <YStack alignItems="center" gap={SPACING.xs}>
              <Text variant="h3">發生錯誤</Text>
              <Text color="textSubtle" style={styles.message}>
                很抱歉，發生了一些問題。請稍後再試。
              </Text>
            </YStack>
            <Button
              variant="primary"
              onPress={this.handleRetry}
              style={styles.retryButton}
            >
              <View style={styles.buttonContent}>
                <RefreshCw size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>重試</Text>
              </View>
            </Button>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text variant="caption" color="textMuted">
                  {this.state.error.message}
                </Text>
              </View>
            )}
          </YStack>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.pageBg,
    padding: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.sm,
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorDetails: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    maxWidth: '100%',
  },
})

export default ErrorBoundary
