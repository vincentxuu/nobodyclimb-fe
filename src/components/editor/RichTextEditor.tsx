'use client'

import { useMemo, useState, useEffect, ComponentType } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

// Loading placeholder
function EditorPlaceholder() {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-lg border border-[#E5E5E5] bg-gray-50">
      <span className="text-gray-400">載入編輯器中...</span>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '請輸入文章內容...',
  className = '',
}: RichTextEditorProps) {
  // 完全在 client-side 載入 ReactQuill，避免 build-time 分析
  const [QuillComponent, setQuillComponent] = useState<ComponentType<any> | null>(null)

  useEffect(() => {
    let mounted = true
    import('react-quill-new').then((mod) => {
      if (mounted) {
        setQuillComponent(() => mod.default)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean'],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  )

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
  ]

  // 尚未載入時顯示 placeholder
  if (!QuillComponent) {
    return <EditorPlaceholder />
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <QuillComponent
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 300px;
          font-size: 16px;
          font-family: inherit;
          background-color: white;
        }
        .rich-text-editor .ql-editor {
          min-height: 300px;
          line-height: 1.8;
          color: #1b1a1a;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
          left: 15px;
          right: 15px;
          pointer-events: none;
        }
        /* 確保有內容時不顯示 placeholder */
        .rich-text-editor .ql-editor:not(.ql-blank)::before {
          display: none !important;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background-color: #f9fafb;
          border-color: #e5e7eb;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border-color: #e5e7eb;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          color: #6b7280;
        }
        .rich-text-editor .ql-editor pre.ql-syntax {
          background-color: #1f2937;
          color: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  )
}
