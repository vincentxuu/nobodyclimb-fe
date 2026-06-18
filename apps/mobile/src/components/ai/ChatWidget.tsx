import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import type { AiQuota, ApiResponse } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  History,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  SquarePen,
  Trash2,
  User,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, IconButton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface AIChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url?: string
  score: number
}

interface AIAskResponse {
  answer: string
  sources?: AISource[]
  query_id?: string
  suggested_questions?: string[]
  quota?: AiQuota
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AISource[]
  queryId?: string
  suggestedQuestions?: string[]
}

interface ChatSession {
  id: string
  title: string
  created_at: number
  updated_at: number
}

interface SavedChatMessage {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[] | string
  query_id?: string
  created_at: number
}

interface SaveMessageRequest {
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[]
  query_id?: string
}

const SUGGESTION_POOL = [
  '推薦 3 條龍洞 5.10 的經典路線',
  '我最高完攀 5.10d，推薦可以突破的路線',
  '關子嶺有哪些 5.9 到 5.10 的練習路線？',
  '我爬了天天天藍，下一條可以試什麼？',
  '墾丁有什麼適合第一次戶外攀岩的路線？',
]

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getRandomSuggestions() {
  return [...SUGGESTION_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp
  if (seconds < 60) return '剛剛'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小時前`
  return `${Math.floor(seconds / 86400)} 天前`
}

function parseSuggestedQuestions(value: SavedChatMessage['suggested_questions']) {
  if (!value) return undefined
  if (Array.isArray(value)) return value

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : undefined
  } catch {
    return undefined
  }
}

async function askAI(query: string, chatHistory: AIChatHistoryMessage[]) {
  const response = await apiClient.post<ApiResponse<AIAskResponse>>(
    '/ai/ask',
    {
      query,
      include_sources: true,
      chat_history: chatHistory.length > 0 ? chatHistory : undefined,
    },
    { timeout: 60000 }
  )

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || response.data.error || 'AI 服務暫時無法使用')
  }

  return response.data.data
}

async function getMyQuota() {
  const response = await apiClient.get<ApiResponse<AiQuota>>('/ai/quota/me')
  return response.data.data ?? null
}

async function createChatSession() {
  const response = await apiClient.post<ApiResponse<ChatSession>>('/ai/sessions')
  if (!response.data.data) throw new Error('無法建立 AI 對話')
  return response.data.data
}

async function getChatSessions() {
  const response = await apiClient.get<ApiResponse<ChatSession[]>>('/ai/sessions')
  return response.data.data ?? []
}

async function getChatMessages(sessionId: string) {
  const response = await apiClient.get<ApiResponse<SavedChatMessage[]>>(
    `/ai/sessions/${sessionId}/messages`
  )
  return response.data.data ?? []
}

async function deleteChatSession(sessionId: string) {
  await apiClient.delete(`/ai/sessions/${sessionId}`)
}

async function saveMessage(sessionId: string, message: SaveMessageRequest) {
  await apiClient.post<ApiResponse<{ id: string }>>(`/ai/sessions/${sessionId}/messages`, message)
}

function SourceList({ sources }: { sources: AISource[] }) {
  if (sources.length === 0) return null

  return (
    <View style={styles.sources}>
      <Text variant="small" color="textMuted">
        參考資料
      </Text>
      {sources.slice(0, 3).map((source) => (
        <Pressable
          key={source.id}
          style={styles.sourceCard}
          disabled={!source.url}
          onPress={() => source.url && Linking.openURL(source.url).catch(() => {})}
        >
          <View style={styles.sourceText}>
            <Text variant="small" fontWeight="600" numberOfLines={1}>
              {source.title}
            </Text>
            <Text variant="caption" color="textMuted" numberOfLines={2}>
              {source.excerpt}
            </Text>
          </View>
          {source.url && <ExternalLink size={14} color={SEMANTIC_COLORS.textMuted} />}
        </Pressable>
      ))}
    </View>
  )
}

function MessageBubble({
  message,
  isLastAssistant,
  isPending,
  onRegenerate,
}: {
  message: ChatMessage
  isLastAssistant: boolean
  isPending: boolean
  onRegenerate: () => void
}) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
      <View style={[styles.messageIcon, isUser ? styles.userIcon : styles.assistantIcon]}>
        {isUser ? <User size={14} color="#FFFFFF" /> : <Bot size={14} color={WB_COLORS[100]} />}
      </View>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={isUser ? styles.userMessageText : styles.assistantMessageText}>
          {message.content}
        </Text>
        {!isUser && <SourceList sources={message.sources ?? []} />}
        {!isUser && isLastAssistant && (
          <Pressable
            style={[styles.regenerateButton, isPending && styles.disabledButton]}
            disabled={isPending}
            onPress={onRegenerate}
          >
            <RefreshCw size={13} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="caption" color="textMuted">
              重新生成
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

export function ChatWidget() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => !!state.user)
  const scrollRef = useRef<ScrollView>(null)
  const sessionIdRef = useRef<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [quota, setQuota] = useState<AiQuota | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>(() => getRandomSuggestions())
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const updateSessionId = useCallback((sessionId: string | null) => {
    sessionIdRef.current = sessionId
    setCurrentSessionId(sessionId)
  }, [])

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return

    let cancelled = false

    Promise.allSettled([getMyQuota(), getChatSessions()]).then(([quotaResult, sessionsResult]) => {
      if (cancelled) return

      if (quotaResult.status === 'fulfilled') {
        setQuota(quotaResult.value)
      }

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value)
        const latest = sessionsResult.value[0]
        if (latest && !sessionIdRef.current && messages.length === 0) {
          getChatMessages(latest.id)
            .then((savedMessages) => {
              if (cancelled) return
              updateSessionId(latest.id)
              setMessages(
                savedMessages.map((message) => ({
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  queryId: message.query_id,
                  suggestedQuestions: parseSuggestedQuestions(message.suggested_questions),
                }))
              )
            })
            .catch(() => {})
        } else if (!latest && !sessionIdRef.current) {
          createChatSession()
            .then((session) => {
              if (cancelled) return
              updateSessionId(session.id)
            })
            .catch(() => {})
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isOpen, messages.length, updateSessionId])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    return () => clearTimeout(timer)
  }, [isOpen, messages])

  const handleOpen = () => {
    setSuggestions(getRandomSuggestions())
    setIsOpen(true)
  }

  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current
    const session = await createChatSession()
    updateSessionId(session.id)
    return session.id
  }, [updateSessionId])

  const handleSubmit = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim()
      if (!query || isSubmitting || isRegenerating) return

      if (!isAuthenticated) {
        setShowLoginPrompt(true)
        return
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: query,
      }

      const chatHistory = messages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content,
      }))

      setMessages((current) => [...current, userMessage])
      setInput('')
      setSuggestions([])
      setShowLoginPrompt(false)
      setIsSubmitting(true)

      try {
        const sessionId = await ensureSession()
        await saveMessage(sessionId, { role: 'user', content: query })
        const data = await askAI(query, chatHistory)
        const assistantMessage: ChatMessage = {
          id: createMessageId(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources ?? [],
          queryId: data.query_id,
          suggestedQuestions: data.suggested_questions,
        }
        setMessages((current) => [...current, assistantMessage])
        setSuggestions(data.suggested_questions ?? [])
        if (data.quota) {
          setQuota(data.quota)
        }
        await saveMessage(sessionId, {
          role: 'assistant',
          content: data.answer,
          suggested_questions: data.suggested_questions,
          query_id: data.query_id,
        })
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number; data?: ApiResponse<AiQuota> } }
        const quotaData = axiosError.response?.data?.data

        if (axiosError.response?.status === 429 && quotaData) {
          setQuota(quotaData)
          setMessages((current) => [
            ...current,
            {
              id: createMessageId(),
              role: 'assistant',
              content: `今日 AI 使用配額已用盡（${quotaData.daily_used}/${quotaData.daily_limit} 次）。配額將於明日重置。`,
            },
          ])
        } else {
          const message = error instanceof Error ? error.message : '抱歉，AI 服務暫時無法使用'
          setMessages((current) => [
            ...current,
            {
              id: createMessageId(),
              role: 'assistant',
              content: message,
            },
          ])
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [ensureSession, isAuthenticated, isRegenerating, isSubmitting, messages]
  )

  const handleRegenerate = useCallback(async () => {
    if (isSubmitting || isRegenerating) return
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
    if (!lastUserMessage) return

    const withoutLastAssistant =
      messages[messages.length - 1]?.role === 'assistant' ? messages.slice(0, -1) : messages
    const chatHistory = withoutLastAssistant.slice(-6).map((message) => ({
      role: message.role,
      content: message.content,
    }))

    setMessages(withoutLastAssistant)
    setSuggestions([])
    setIsRegenerating(true)

    try {
      const sessionId = await ensureSession()
      const data = await askAI(lastUserMessage.content, chatHistory)
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources ?? [],
          queryId: data.query_id,
          suggestedQuestions: data.suggested_questions,
        },
      ])
      setSuggestions(data.suggested_questions ?? [])
      if (data.quota) setQuota(data.quota)
      await saveMessage(sessionId, {
        role: 'assistant',
        content: data.answer,
        suggested_questions: data.suggested_questions,
        query_id: data.query_id,
      })
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: '抱歉，重新生成失敗，請稍後再試。',
        },
      ])
    } finally {
      setIsRegenerating(false)
    }
  }, [ensureSession, isRegenerating, isSubmitting, messages])

  const handleClear = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (sessionId) {
      try {
        await deleteChatSession(sessionId)
      } catch {}
    }

    setMessages([])
    setSuggestions(getRandomSuggestions())
    setShowLoginPrompt(false)
    setShowConfirmClear(false)
    updateSessionId(null)

    if (isAuthenticated) {
      try {
        const session = await createChatSession()
        updateSessionId(session.id)
        setSessions(await getChatSessions())
      } catch {}
    }
  }, [isAuthenticated, updateSessionId])

  const handleNewChat = useCallback(async () => {
    setMessages([])
    setSuggestions(getRandomSuggestions())
    setShowLoginPrompt(false)
    setShowConfirmClear(false)
    updateSessionId(null)

    try {
      const session = await createChatSession()
      updateSessionId(session.id)
      setSessions(await getChatSessions())
    } catch {}
  }, [updateSessionId])

  const handleOpenHistory = useCallback(async () => {
    try {
      setSessions(await getChatSessions())
    } catch {}
    setShowHistory(true)
  }, [])

  const handleSwitchSession = useCallback(
    async (sessionId: string) => {
      try {
        const savedMessages = await getChatMessages(sessionId)
        updateSessionId(sessionId)
        setMessages(
          savedMessages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            queryId: message.query_id,
            suggestedQuestions: parseSuggestedQuestions(message.suggested_questions),
          }))
        )
        setSuggestions([])
        setShowHistory(false)
        setShowConfirmClear(false)
      } catch {}
    },
    [updateSessionId]
  )

  const handleLogin = () => {
    setIsOpen(false)
    setShowLoginPrompt(false)
    router.push('/auth/login')
  }

  const lastAssistantIndex = messages.reduce(
    (last, message, index) => (message.role === 'assistant' ? index : last),
    -1
  )
  const isBusy = isSubmitting || isRegenerating

  return (
    <>
      <Pressable style={styles.floatingButton} onPress={handleOpen}>
        <MessageCircle size={24} color="#FFFFFF" />
      </Pressable>

      <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <View>
                <Text variant="h3" fontWeight="700">
                  攀岩 AI 助手
                </Text>
                <Text variant="small" color="textMuted">
                  {quota
                    ? `${quota.tier_display} · 今日剩餘 ${quota.remaining} 次`
                    : '路線推薦與攀岩知識'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                {isAuthenticated && !showHistory && (
                  <>
                    {messages.length > 0 &&
                      (showConfirmClear ? (
                        <View style={styles.confirmClear}>
                          <Text variant="caption" color="textMuted">
                            清除？
                          </Text>
                          <Pressable onPress={handleClear} style={styles.confirmAction}>
                            <Text variant="caption" style={styles.dangerText}>
                              確定
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setShowConfirmClear(false)}
                            style={styles.confirmAction}
                          >
                            <Text variant="caption" color="textMuted">
                              取消
                            </Text>
                          </Pressable>
                        </View>
                      ) : (
                        <IconButton
                          icon={<Trash2 size={19} color={SEMANTIC_COLORS.textMuted} />}
                          variant="ghost"
                          onPress={() => setShowConfirmClear(true)}
                        />
                      ))}
                    <IconButton
                      icon={<SquarePen size={19} color={SEMANTIC_COLORS.textMuted} />}
                      variant="ghost"
                      onPress={handleNewChat}
                    />
                    <IconButton
                      icon={<History size={19} color={SEMANTIC_COLORS.textMuted} />}
                      variant="ghost"
                      onPress={handleOpenHistory}
                    />
                  </>
                )}
                {showHistory && (
                  <IconButton
                    icon={<ChevronLeft size={20} color={SEMANTIC_COLORS.textMuted} />}
                    variant="ghost"
                    onPress={() => setShowHistory(false)}
                  />
                )}
                <IconButton
                  icon={<X size={22} color={SEMANTIC_COLORS.textMain} />}
                  variant="ghost"
                  onPress={() => {
                    setIsOpen(false)
                    setShowHistory(false)
                    setShowConfirmClear(false)
                  }}
                />
              </View>
            </View>

            {showHistory ? (
              <ScrollView style={styles.messages} contentContainerStyle={styles.historyContent}>
                <Text variant="small" color="textMuted">
                  最近對話
                </Text>
                {sessions.length === 0 ? (
                  <Text variant="body" color="textMuted" style={styles.emptyHistory}>
                    還沒有歷史對話
                  </Text>
                ) : (
                  sessions.map((session) => (
                    <Pressable
                      key={session.id}
                      style={[
                        styles.sessionItem,
                        session.id === currentSessionId && styles.activeSessionItem,
                      ]}
                      onPress={() => handleSwitchSession(session.id)}
                    >
                      <Text variant="bodyBold" numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {formatRelativeTime(session.updated_at)}
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            ) : (
              <>
                <ScrollView
                  ref={scrollRef}
                  style={styles.messages}
                  contentContainerStyle={styles.messagesContent}
                >
                  {messages.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyIcon}>
                        <MessageCircle size={28} color={WB_COLORS[100]} />
                      </View>
                      <Text variant="h4" fontWeight="700">
                        想找下一條路線？
                      </Text>
                      <Text variant="body" color="textMuted" style={styles.emptyCopy}>
                        詢問岩場、難度、風格或根據完攀紀錄取得建議。
                      </Text>
                    </View>
                  ) : (
                    messages.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isLastAssistant={index === lastAssistantIndex}
                        isPending={isBusy}
                        onRegenerate={handleRegenerate}
                      />
                    ))
                  )}

                  {isBusy && (
                    <View style={styles.loadingRow}>
                      <Loader2 size={16} color={SEMANTIC_COLORS.textMuted} />
                      <Text variant="small" color="textMuted">
                        AI 正在整理建議...
                      </Text>
                    </View>
                  )}

                  {showLoginPrompt && (
                    <View style={styles.loginPrompt}>
                      <Text variant="bodyBold">登入後即可使用 AI 助手</Text>
                      <Text variant="small" color="textMuted">
                        AI 會根據你的攀登紀錄與平台資料給出更準確的推薦。
                      </Text>
                      <Button variant="primary" onPress={handleLogin} style={styles.loginButton}>
                        <Text fontWeight="600" style={styles.primaryText}>
                          前往登入
                        </Text>
                      </Button>
                    </View>
                  )}
                </ScrollView>

                {suggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    <View style={styles.suggestionsHeader}>
                      <Text variant="small" color="textMuted">
                        建議問題
                      </Text>
                      <ChevronDown size={14} color={SEMANTIC_COLORS.textMuted} />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {suggestions.map((suggestion) => (
                        <Pressable
                          key={suggestion}
                          style={styles.suggestionChip}
                          onPress={() => handleSubmit(suggestion)}
                        >
                          <Text variant="small">{suggestion}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.inputBar}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="輸入問題..."
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    multiline
                    maxLength={500}
                  />
                  <IconButton
                    icon={<Send size={18} color="#FFFFFF" />}
                    variant="primary"
                    disabled={isBusy || !input.trim()}
                    onPress={() => handleSubmit(input)}
                  />
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SEMANTIC_COLORS.textMain,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modal: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  confirmClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  confirmAction: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
  },
  dangerText: {
    color: '#D92D20',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE70C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    textAlign: 'center',
    lineHeight: 22,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
  },
  messageIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIcon: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  assistantIcon: {
    backgroundColor: '#FFE70C',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  userBubble: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  assistantBubble: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userMessageText: {
    color: '#FFFFFF',
    lineHeight: 22,
  },
  assistantMessageText: {
    color: SEMANTIC_COLORS.textMain,
    lineHeight: 22,
  },
  sources: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: WB_COLORS[5],
  },
  sourceText: {
    flex: 1,
  },
  regenerateButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  disabledButton: {
    opacity: 0.45,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  loginPrompt: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  loginButton: {
    alignSelf: 'flex-start',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  suggestions: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    gap: SPACING.xs,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  historyContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  emptyHistory: {
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  sessionItem: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    gap: 4,
  },
  activeSessionItem: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[5],
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
})

export default ChatWidget
