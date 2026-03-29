'use client'

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Edit,
  Eye,
  FileText,
  History,
  Loader2,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AIPrompt,
  useAIPromptDefaults,
  useAIPrompts,
  useAIPromptsByName,
  useCreateAIPrompt,
} from '@/lib/api/admin-ai'
import { PROMPT_NAMES, PROMPT_VARIABLE_MAP } from '@/lib/prompt-variables'
import { formatTaipei } from '@/lib/utils'

export default function AdminAIPromptsPage() {
  const { data: prompts, isLoading: promptsLoading } = useAIPrompts()
  const { data: defaults, isLoading: defaultsLoading } = useAIPromptDefaults()
  const [expanded, setExpanded] = useState<string | null>(null)

  const isLoading = promptsLoading || defaultsLoading

  // 建立每個 prompt name 的 active 版本 map
  const activeMap = new Map<string, { version: number; updated_at: string }>()
  if (prompts) {
    for (const p of prompts) {
      if (p.status === 'active' && !activeMap.has(p.name)) {
        activeMap.set(p.name, { version: p.version, updated_at: p.updated_at })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">Prompt 管理</h1>
        <p className="mt-1 text-sm text-wb-60">
          管理 AI 系統使用的 10 個核心提示詞模板，點擊展開瀏覽與編輯
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
        </div>
      ) : (
        <div className="space-y-2">
          {PROMPT_NAMES.map((name) => {
            const info = PROMPT_VARIABLE_MAP[name]
            const active = activeMap.get(name)
            const def = defaults?.find((d) => d.name === name)
            const isOpen = expanded === name

            return (
              <div
                key={name}
                className={`rounded-xl border bg-white transition-all ${
                  isOpen ? 'border-wb-40 shadow-sm' : 'border-wb-20'
                }`}
              >
                {/* Card header — 點擊展開/收合 */}
                <button
                  onClick={() => setExpanded(isOpen ? null : name)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isOpen ? 'bg-wb-10 text-wb-80' : 'bg-wb-05 text-wb-50'
                      }`}
                    >
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-wb-100">
                          {info?.label ?? def?.label ?? name}
                        </span>
                        {active ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            v{active.version}
                          </span>
                        ) : (
                          <span className="rounded-full bg-wb-10 px-2 py-0.5 text-xs font-medium text-wb-50">
                            使用預設
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-wb-50">
                        <code className="rounded bg-wb-05 px-1.5 py-0.5 font-mono text-wb-60">
                          {name}
                        </code>
                        {active && <span>{formatTaipei(active.updated_at)}</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-wb-40 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Expanded editor panel */}
                {isOpen && (
                  <PromptEditor
                    name={name}
                    defaultPrompt={def ?? null}
                    variables={info?.variables ?? def?.variables ?? []}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =============================================
// PromptEditor：展開後的內嵌編輯器
// =============================================

function PromptEditor({
  name,
  defaultPrompt,
  variables,
}: {
  name: string
  defaultPrompt: { content: string; variables: string[] } | null
  variables: string[]
}) {
  const { data: versions } = useAIPromptsByName(name)
  const { mutateAsync: createPrompt, isPending: isSaving } = useCreateAIPrompt()

  const activeVersion = versions?.find((v) => v.status === 'active')
  const isUsingDefault = !activeVersion

  const [tab, setTab] = useState<'editor' | 'history'>('editor')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState<AIPrompt | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 載入內容
  useEffect(() => {
    if (activeVersion) {
      setContent(activeVersion.content ?? '')
    } else if (defaultPrompt) {
      setContent(defaultPrompt.content)
    }
  }, [activeVersion, defaultPrompt])

  const validateVariables = useCallback(
    (text: string): string | null => {
      if (variables.length === 0) return null
      const missing = variables.filter((v) => !text.includes(`{${v}}`))
      if (missing.length === 0) return null
      return `缺少變數：${missing.map((v) => `{${v}}`).join('、')}。儲存後可能影響功能運作。`
    },
    [variables]
  )

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const placeholder = `{${variable}}`
    const newContent = content.slice(0, start) + placeholder + content.slice(end)
    setContent(newContent)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length
    })
  }

  const doSave = async (saveContent: string) => {
    try {
      await createPrompt({ name, content: saveContent, variables, status: 'active' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('儲存失敗，請稍後再試。')
    }
  }

  const handleSave = async () => {
    if (!content.trim()) return
    const warn = validateVariables(content)
    if (warn) {
      setWarning(warn)
      return
    }
    await doSave(content)
  }

  const handleSaveWithWarning = async () => {
    setWarning(null)
    await doSave(content)
  }

  const handleRollback = async (version: AIPrompt) => {
    if (!confirm(`確定要回滾到 v${version.version} 嗎？將以此版本內容建立新的 active 版本。`))
      return
    await doSave(version.content ?? '')
    setPreviewVersion(null)
    setTab('editor')
  }

  const handleResetToDefault = async () => {
    if (!defaultPrompt) return
    if (!confirm('確定要重置為預設模板嗎？將以預設內容建立新版本。')) return
    await doSave(defaultPrompt.content)
  }

  return (
    <div className="border-t border-wb-10 px-5 pb-5">
      {/* Sub-tabs + 重置按鈕 */}
      <div className="flex items-center justify-between py-3">
        <div className="flex gap-1 rounded-lg bg-wb-05 p-0.5">
          <button
            onClick={() => setTab('editor')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'editor' ? 'bg-white text-wb-100 shadow-sm' : 'text-wb-50 hover:text-wb-70'
            }`}
          >
            <Edit className="h-3 w-3" />
            編輯
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === 'history' ? 'bg-white text-wb-100 shadow-sm' : 'text-wb-50 hover:text-wb-70'
            }`}
          >
            <History className="h-3 w-3" />
            歷史
            {versions && versions.length > 0 && (
              <span className="rounded-full bg-wb-10 px-1.5 text-[10px] text-wb-60">
                {versions.length}
              </span>
            )}
          </button>
        </div>

        {defaultPrompt && !isUsingDefault && (
          <button
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="flex items-center gap-1 rounded-lg border border-wb-20 px-2.5 py-1 text-xs text-wb-60 hover:bg-wb-05 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            重置為預設
          </button>
        )}
      </div>

      {/* Editor Tab */}
      {tab === 'editor' && (
        <div className="space-y-3">
          {isUsingDefault && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              目前使用預設模板。編輯後儲存即可建立第一個自訂版本。
            </div>
          )}

          {/* 變數提示 */}
          {variables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-wb-50">變數：</span>
              {variables.map((v) => (
                <button
                  key={v}
                  onClick={() => insertVariable(v)}
                  className="rounded bg-wb-05 border border-wb-15 px-1.5 py-0.5 font-mono text-[11px] text-wb-70 hover:bg-wb-10 transition-colors"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-wb-100 resize-y"
            placeholder="輸入 prompt 內容..."
            spellCheck={false}
          />

          {/* Warning */}
          {warning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{warning}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWithWarning}
                  disabled={isSaving}
                  className="rounded-md bg-amber-600 px-2.5 py-1 text-xs text-white hover:bg-amber-700 transition-colors"
                >
                  仍要儲存
                </button>
                <button
                  onClick={() => setWarning(null)}
                  className="rounded-md border border-wb-20 px-2.5 py-1 text-xs text-wb-70 hover:bg-wb-05 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Save */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-wb-100 px-4 py-2 text-xs text-white hover:bg-wb-90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saved ? '已儲存！' : isUsingDefault ? '建立自訂版本' : '儲存新版本'}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {!versions?.length ? (
            <p className="py-6 text-center text-xs text-wb-50">
              尚無版本歷史，所有查詢使用預設模板
            </p>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className={`rounded-lg border transition-all ${
                  previewVersion?.id === v.id ? 'border-wb-40' : 'border-wb-15'
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-wb-100">v{v.version}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        v.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-wb-10 text-wb-50'
                      }`}
                    >
                      {v.status === 'active' ? '啟用中' : '已封存'}
                    </span>
                    <span className="text-[10px] text-wb-50">{formatTaipei(v.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewVersion(previewVersion?.id === v.id ? null : v)}
                      className="flex items-center gap-1 rounded border border-wb-15 px-2 py-0.5 text-[10px] text-wb-60 hover:bg-wb-05 transition-colors"
                    >
                      <Eye className="h-2.5 w-2.5" />
                      {previewVersion?.id === v.id ? '收起' : '預覽'}
                    </button>
                    {v.status !== 'active' && (
                      <button
                        onClick={() => handleRollback(v)}
                        disabled={isSaving}
                        className="flex items-center gap-1 rounded border border-wb-15 px-2 py-0.5 text-[10px] text-wb-60 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        回滾
                      </button>
                    )}
                  </div>
                </div>
                {previewVersion?.id === v.id && v.content && (
                  <div className="border-t border-wb-10 px-3 py-2">
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-wb-05 p-2.5 font-mono text-[11px] text-wb-80">
                      {v.content}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
