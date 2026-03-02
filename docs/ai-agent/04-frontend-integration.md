# 前端整合細節

## 新增檔案結構

```
apps/web/src/
├── components/
│   └── ai/
│       ├── ChatWidget.tsx       # 聊天介面主元件
│       ├── ChatMessage.tsx      # 訊息元件
│       ├── SourceCard.tsx       # 來源卡片
│       ├── FeedbackButtons.tsx  # 回饋按鈕
│       └── index.ts             # 匯出
└── lib/
    └── api/
        └── ai.ts                # AI API 客戶端
```

## API 客戶端

```typescript
// apps/web/src/lib/api/ai.ts

import { apiClient } from './client';

export interface AIAskRequest {
  query: string;
  limit?: number;
  include_sources?: boolean;
}

export interface AIAskResponse {
  answer: string;
  sources: AISource[];
  query_id: string;
}

export interface AISource {
  id: string;
  type: 'route' | 'crag' | 'video' | 'article';
  title: string;
  excerpt: string;
  url?: string;
  score: number;
}

export interface AISearchResult {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  url?: string;
  score: number;
}

export interface AIFeedbackRequest {
  query_id: string;
  score: 1 | 2 | 3 | 4 | 5;
  text?: string;
}

// AI 問答
export async function askAI(request: AIAskRequest): Promise<AIAskResponse> {
  const response = await apiClient.post('/ai/ask', request);
  return response.data.data;
}

// 語義搜尋
export async function searchAI(
  query: string,
  options?: { type?: string; limit?: number }
): Promise<AISearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (options?.type) params.append('type', options.type);
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await apiClient.get(`/ai/search?${params.toString()}`);
  return response.data.data;
}

// 提交回饋
export async function submitFeedback(request: AIFeedbackRequest): Promise<void> {
  await apiClient.post('/ai/feedback', request);
}

// Health check
export async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/ai/health');
    return response.data.success;
  } catch {
    return false;
  }
}
```

## React Query Hooks

```typescript
// apps/web/src/lib/api/ai.ts (續)

import { useMutation, useQuery } from '@tanstack/react-query';

// useAskAI hook
export function useAskAI() {
  return useMutation({
    mutationFn: askAI,
    onError: (error) => {
      console.error('AI Ask Error:', error);
    },
  });
}

// useSearchAI hook
export function useSearchAI(query: string, options?: { type?: string; limit?: number }) {
  return useQuery({
    queryKey: ['ai-search', query, options],
    queryFn: () => searchAI(query, options),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 分鐘
  });
}

// useSubmitFeedback hook
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback,
  });
}

// useAIHealth hook
export function useAIHealth() {
  return useQuery({
    queryKey: ['ai-health'],
    queryFn: checkAIHealth,
    staleTime: 1000 * 60 * 10, // 10 分鐘
    retry: false,
  });
}
```

## ChatWidget 元件

```tsx
// apps/web/src/components/ai/ChatWidget.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAskAI, AIAskResponse } from '@/lib/api/ai';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: AIAskResponse['sources'];
  queryId?: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const askMutation = useAskAI();

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 開啟時自動 focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || askMutation.isPending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response = await askMutation.mutateAsync({
        query: input.trim(),
        include_sources: true,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response.answer,
        sources: response.sources,
        queryId: response.query_id,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: '抱歉，發生錯誤，請稍後再試。',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <>
      {/* 觸發按鈕 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 聊天視窗 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'w-[380px] h-[600px] max-h-[80vh]',
              'bg-background border rounded-xl shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">攀岩 AI 助手</h3>
                  <p className="text-xs text-muted-foreground">
                    問我關於攀岩的問題
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">👋 你好！我是攀岩 AI 助手</p>
                  <p className="text-xs mt-2">
                    你可以問我關於岩場、路線、難度等問題
                  </p>
                  <div className="mt-4 space-y-2">
                    <SuggestionButton
                      onClick={() => setInput('北部有什麼適合初學者的岩場？')}
                    >
                      北部有什麼適合初學者的岩場？
                    </SuggestionButton>
                    <SuggestionButton
                      onClick={() => setInput('推薦龍洞的 5.10 路線')}
                    >
                      推薦龍洞的 5.10 路線
                    </SuggestionButton>
                    <SuggestionButton
                      onClick={() => setInput('冬天可以爬哪些岩場？')}
                    >
                      冬天可以爬哪些岩場？
                    </SuggestionButton>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {askMutation.isPending && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">思考中...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="輸入你的問題..."
                  disabled={askMutation.isPending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || askMutation.isPending}
                >
                  {askMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SuggestionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
    >
      {children}
    </button>
  );
}
```

## ChatMessage 元件

```tsx
// apps/web/src/components/ai/ChatMessage.tsx

'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubmitFeedback, AISource } from '@/lib/api/ai';
import { SourceCard } from './SourceCard';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: AISource[];
  queryId?: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const feedbackMutation = useSubmitFeedback();

  const handleFeedback = async (score: 1 | 5) => {
    if (!message.queryId || feedbackGiven) return;

    await feedbackMutation.mutateAsync({
      query_id: message.queryId,
      score,
    });

    setFeedbackGiven(true);
  };

  const isUser = message.type === 'user';

  return (
    <div
      className={cn(
        'flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {/* 訊息內容 */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* 來源 */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium opacity-70">參考來源：</p>
            {message.sources.slice(0, 3).map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        )}

        {/* 回饋按鈕 */}
        {!isUser && message.queryId && (
          <div className="mt-3 flex items-center gap-2">
            {feedbackGiven ? (
              <span className="text-xs opacity-70">感謝您的回饋！</span>
            ) : (
              <>
                <span className="text-xs opacity-70">這個回答有幫助嗎？</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleFeedback(5)}
                  disabled={feedbackMutation.isPending}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleFeedback(1)}
                  disabled={feedbackMutation.isPending}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## SourceCard 元件

```tsx
// apps/web/src/components/ai/SourceCard.tsx

'use client';

import Link from 'next/link';
import { ExternalLink, Mountain, MapPin, Video } from 'lucide-react';
import { AISource } from '@/lib/api/ai';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  source: AISource;
}

const typeIcons = {
  route: Mountain,
  crag: MapPin,
  video: Video,
  article: ExternalLink,
};

const typeLabels = {
  route: '路線',
  crag: '岩場',
  video: '影片',
  article: '文章',
};

export function SourceCard({ source }: SourceCardProps) {
  const Icon = typeIcons[source.type];

  const content = (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-md',
        'bg-background/50 hover:bg-background/80 transition-colors',
        'text-xs'
      )}
    >
      <Icon className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{source.title}</p>
        <p className="opacity-60 mt-0.5">{typeLabels[source.type]}</p>
      </div>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-40" />
    </div>
  );

  if (source.url) {
    const isExternal = source.url.startsWith('http');

    if (isExternal) {
      return (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={source.url} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
```

## 在頁面中使用

```tsx
// apps/web/src/app/layout.tsx (修改)

import { ChatWidget } from '@/components/ai/ChatWidget';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
```

## 匯出檔案

```typescript
// apps/web/src/components/ai/index.ts

export { ChatWidget } from './ChatWidget';
export { ChatMessage } from './ChatMessage';
export { SourceCard } from './SourceCard';
```

## 樣式考量

### 深色模式支援

ChatWidget 已使用 Tailwind CSS 的語義化顏色 (`bg-background`, `text-foreground`, `bg-muted` 等)，會自動支援深色模式。

### RWD 響應式

在行動裝置上，建議將聊天視窗調整為全螢幕模式：

```tsx
// ChatWidget.tsx (修改 className)

className={cn(
  'fixed z-50',
  // 桌面版
  'md:bottom-6 md:right-6 md:w-[380px] md:h-[600px] md:max-h-[80vh] md:rounded-xl',
  // 行動版 - 全螢幕
  'bottom-0 right-0 w-full h-full rounded-none',
  'bg-background border shadow-2xl',
  'flex flex-col overflow-hidden'
)}
```

### 動畫效果

使用 Framer Motion 提供流暢的開關動畫。可根據需求調整 `transition` 參數。

## 可選功能擴充

### 1. 語音輸入

```tsx
// 新增麥克風按鈕
import { Mic } from 'lucide-react';

// 使用 Web Speech API
const startListening = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'zh-TW';
  recognition.onresult = (event) => {
    setInput(event.results[0][0].transcript);
  };
  recognition.start();
};
```

### 2. 歷史記錄

```tsx
// 使用 localStorage 或 IndexedDB 儲存對話歷史
const saveHistory = (messages: Message[]) => {
  localStorage.setItem('ai-chat-history', JSON.stringify(messages));
};

const loadHistory = (): Message[] => {
  const saved = localStorage.getItem('ai-chat-history');
  return saved ? JSON.parse(saved) : [];
};
```

### 3. 快捷鍵

```tsx
// 使用 useHotkeys 監聽快捷鍵
import { useHotkeys } from 'react-hotkeys-hook';

useHotkeys('mod+k', () => setIsOpen(true));
useHotkeys('escape', () => setIsOpen(false));
```

## 測試

### 單元測試

```typescript
// apps/web/src/components/ai/__tests__/ChatWidget.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { ChatWidget } from '../ChatWidget';

describe('ChatWidget', () => {
  it('renders trigger button', () => {
    render(<ChatWidget />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens chat window on click', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('攀岩 AI 助手')).toBeInTheDocument();
  });
});
```
