import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Eye,
  FileText,
  History,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AIPrompt,
  type AIPromptDefault,
  useAIPromptDefaults,
  useAIPrompts,
  useAIPromptsByName,
  useCreateAIPrompt,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function parseVariables(value?: string) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function PromptCard({
  prompt,
  active,
  expanded,
  onToggle,
}: {
  prompt: AIPromptDefault
  active?: AIPrompt
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <View style={[styles.promptCard, expanded && styles.promptCardExpanded]}>
      <Pressable style={styles.promptHeader} onPress={onToggle}>
        <View style={styles.promptIcon}>
          <FileText size={20} color={SEMANTIC_COLORS.textMain} />
        </View>
        <View style={styles.promptInfo}>
          <View style={styles.promptTitleRow}>
            <Text variant="bodyBold" numberOfLines={1} style={styles.promptTitle}>
              {prompt.label}
            </Text>
            <View style={[styles.statusPill, active ? styles.statusActive : styles.statusDefault]}>
              <Text
                variant="caption"
                style={active ? styles.statusTextActive : styles.statusTextDefault}
              >
                {active ? `v${active.version}` : '預設'}
              </Text>
            </View>
          </View>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {prompt.name}
          </Text>
          {active && (
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {formatTime(active.updated_at)}
            </Text>
          )}
        </View>
        <ChevronDown
          size={18}
          color={SEMANTIC_COLORS.textMuted}
          style={expanded ? styles.chevronOpen : undefined}
        />
      </Pressable>
      {expanded && <PromptEditor prompt={prompt} active={active} />}
    </View>
  )
}

function VersionList({
  name,
  onRollback,
  isSaving,
}: {
  name: string
  onRollback: (version: AIPrompt) => void
  isSaving: boolean
}) {
  const { data: versions, isLoading } = useAIPromptsByName(name)
  const [previewId, setPreviewId] = useState<string | null>(null)

  if (isLoading) {
    return <LoadingSpinner size="small" style={styles.versionLoading} />
  }

  if (!versions?.length) {
    return (
      <Text variant="caption" color="textMuted" align="center" style={styles.emptyHistory}>
        尚無版本歷史，所有查詢使用預設模板
      </Text>
    )
  }

  return (
    <View style={styles.versionList}>
      {versions.map((version) => {
        const isPreviewing = previewId === version.id
        return (
          <View key={version.id} style={styles.versionItem}>
            <View style={styles.versionHeader}>
              <View style={styles.versionTitle}>
                <History size={14} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="caption" fontWeight="700">
                  v{version.version}
                </Text>
                <View
                  style={[
                    styles.versionStatus,
                    version.status === 'active' ? styles.statusActive : styles.statusDefault,
                  ]}
                >
                  <Text
                    variant="caption"
                    style={
                      version.status === 'active'
                        ? styles.statusTextActive
                        : styles.statusTextDefault
                    }
                  >
                    {version.status === 'active' ? '啟用中' : '已封存'}
                  </Text>
                </View>
              </View>
              <Text variant="caption" color="textMuted">
                {formatTime(version.updated_at)}
              </Text>
            </View>
            <View style={styles.versionActions}>
              {version.content && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Eye}
                  onPress={() =>
                    setPreviewId((current) => (current === version.id ? null : version.id))
                  }
                >
                  {isPreviewing ? '收起' : '預覽'}
                </Button>
              )}
              {version.status !== 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={RotateCcw}
                  disabled={isSaving}
                  onPress={() => onRollback(version)}
                >
                  回滾
                </Button>
              )}
            </View>
            {isPreviewing && version.content && (
              <Text variant="caption" color="textSubtle" style={styles.versionContent}>
                {version.content}
              </Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

function PromptEditor({ prompt, active }: { prompt: AIPromptDefault; active?: AIPrompt }) {
  const createPrompt = useCreateAIPrompt()
  const [tab, setTab] = useState<'editor' | 'history'>('editor')
  const [content, setContent] = useState(active?.content ?? prompt.content)
  const variables = useMemo(() => {
    const activeVariables = parseVariables(active?.variables)
    return activeVariables.length > 0 ? activeVariables : prompt.variables
  }, [active, prompt.variables])

  useEffect(() => {
    setContent(active?.content ?? prompt.content)
  }, [active?.content, prompt.content])

  const validateVariables = useCallback(
    (text: string) => {
      const missing = variables.filter((variable) => !text.includes(`{${variable}}`))
      return missing
    },
    [variables]
  )

  const saveContent = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    const missing = validateVariables(trimmed)

    const doSave = async () => {
      await createPrompt.mutateAsync({
        name: prompt.name,
        content: trimmed,
        variables,
        status: 'active',
      })
      Alert.alert('已儲存', '已建立新的 active prompt 版本。')
    }

    if (missing.length > 0) {
      Alert.alert(
        '缺少變數',
        `缺少 ${missing.map((item) => `{${item}}`).join('、')}，儲存後可能影響功能運作。`,
        [
          { text: '取消', style: 'cancel' },
          { text: '仍要儲存', style: 'destructive', onPress: doSave },
        ]
      )
      return
    }

    await doSave()
  }, [content, createPrompt, prompt.name, validateVariables, variables])

  const savePromptContent = useCallback(
    async (nextContent: string, nextVariables = variables) => {
      await createPrompt.mutateAsync({
        name: prompt.name,
        content: nextContent,
        variables: nextVariables,
        status: 'active',
      })
    },
    [createPrompt, prompt.name, variables]
  )

  const rollbackVersion = useCallback(
    (version: AIPrompt) => {
      if (!version.content) return
      Alert.alert(
        '回滾版本',
        `確定要回滾到 v${version.version} 嗎？系統會以此內容建立新的 active 版本。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '回滾',
            onPress: async () => {
              const versionVariables = parseVariables(version.variables)
              await savePromptContent(
                version.content ?? '',
                versionVariables.length > 0 ? versionVariables : variables
              )
              setContent(version.content ?? '')
              setTab('editor')
              Alert.alert('已回滾', `已以 v${version.version} 建立新的 active 版本。`)
            },
          },
        ]
      )
    },
    [savePromptContent]
  )

  const resetDefault = useCallback(() => {
    Alert.alert('重置為預設', '確定要以預設模板建立新的 active 版本嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '重置',
        style: 'destructive',
        onPress: async () => {
          await savePromptContent(prompt.content, prompt.variables)
          setContent(prompt.content)
          Alert.alert('已重置', '已以預設模板建立新的 active 版本。')
        },
      },
    ])
  }, [prompt.content, prompt.variables, savePromptContent])

  return (
    <View style={styles.editorPanel}>
      <View style={styles.editorTabs}>
        <Pressable
          style={[styles.editorTab, tab === 'editor' && styles.editorTabActive]}
          onPress={() => setTab('editor')}
        >
          <Text
            variant="caption"
            fontWeight="600"
            style={tab === 'editor' ? styles.editorTabTextActive : styles.editorTabText}
          >
            編輯
          </Text>
        </Pressable>
        <Pressable
          style={[styles.editorTab, tab === 'history' && styles.editorTabActive]}
          onPress={() => setTab('history')}
        >
          <Text
            variant="caption"
            fontWeight="600"
            style={tab === 'history' ? styles.editorTabTextActive : styles.editorTabText}
          >
            歷史
          </Text>
        </Pressable>
      </View>

      {tab === 'editor' ? (
        <View style={styles.editorBody}>
          {variables.length > 0 && (
            <View style={styles.variableWrap}>
              {variables.map((variable) => (
                <Pressable
                  key={variable}
                  style={styles.variablePill}
                  onPress={() => setContent((current) => `${current}{${variable}}`)}
                >
                  <Text variant="caption" style={styles.variableText}>
                    {`{${variable}}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <TextInput
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholder="輸入 prompt 內容"
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
            style={styles.promptInput}
          />
          <View style={styles.editorActions}>
            {active && (
              <Button variant="outline" size="sm" leftIcon={RefreshCw} onPress={resetDefault}>
                重置預設
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={createPrompt.isPending ? undefined : Save}
              onPress={saveContent}
              loading={createPrompt.isPending}
              disabled={!content.trim() || createPrompt.isPending}
            >
              儲存新版本
            </Button>
          </View>
        </View>
      ) : (
        <VersionList
          name={prompt.name}
          onRollback={rollbackVersion}
          isSaving={createPrompt.isPending}
        />
      )}
    </View>
  )
}

export default function AdminAIPromptsScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const promptsQuery = useAIPrompts()
  const defaultsQuery = useAIPromptDefaults()

  const activeMap = useMemo(() => {
    const map = new Map<string, AIPrompt>()
    for (const prompt of promptsQuery.data ?? []) {
      if (prompt.status === 'active' && !map.has(prompt.name)) {
        map.set(prompt.name, prompt)
      }
    }
    return map
  }, [promptsQuery.data])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([promptsQuery.refetch(), defaultsQuery.refetch()])
    setRefreshing(false)
  }, [defaultsQuery, promptsQuery])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={FileText}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到 AI 管理"
          onAction={() => router.replace('/admin/ai' as never)}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
          返回
        </Button>
        <View style={styles.navTitle}>
          <FileText size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            Prompt 管理
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={RefreshCw}
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h2" fontWeight="700">
            Prompt 管理
          </Text>
          <Text variant="body" color="textSubtle">
            管理 AI 系統使用的核心提示詞模板與版本。
          </Text>
        </View>

        {promptsQuery.isLoading || defaultsQuery.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : promptsQuery.error || defaultsQuery.error || !defaultsQuery.data ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入 Prompt"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <View style={styles.promptList}>
            {defaultsQuery.data.map((prompt) => (
              <PromptCard
                key={prompt.name}
                prompt={prompt}
                active={activeMap.get(prompt.name)}
                expanded={expanded === prompt.name}
                onToggle={() =>
                  setExpanded((current) => (current === prompt.name ? null : prompt.name))
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[20],
  },
  navTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    minWidth: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    gap: 6,
    marginBottom: SPACING.lg,
  },
  fullState: {
    flex: 1,
  },
  loading: {
    paddingVertical: 80,
  },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  promptList: {
    gap: SPACING.md,
  },
  promptCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    overflow: 'hidden',
  },
  promptCardExpanded: {
    borderColor: WB_COLORS[50],
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  promptIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  promptInfo: {
    flex: 1,
    gap: 2,
  },
  promptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  promptTitle: {
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusDefault: {
    backgroundColor: WB_COLORS[10],
  },
  statusTextActive: {
    color: '#047857',
  },
  statusTextDefault: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  editorPanel: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[20],
    gap: SPACING.md,
  },
  editorTabs: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  editorTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  editorTabActive: {
    backgroundColor: WB_COLORS[0],
  },
  editorTabText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  editorTabTextActive: {
    color: SEMANTIC_COLORS.textMain,
  },
  editorBody: {
    gap: SPACING.md,
  },
  variableWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  variablePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[10],
  },
  variableText: {
    color: SEMANTIC_COLORS.textSubtle,
    fontFamily: 'monospace',
  },
  promptInput: {
    minHeight: 260,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[0],
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'monospace',
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  versionLoading: {
    paddingVertical: SPACING.xl,
  },
  emptyHistory: {
    paddingVertical: SPACING.xl,
  },
  versionList: {
    gap: SPACING.sm,
  },
  versionItem: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: WB_COLORS[0],
  },
  versionHeader: {
    gap: 4,
  },
  versionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  versionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  versionContent: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[10],
    fontFamily: 'monospace',
  },
})
