import dynamic from 'next/dynamic'

// 動態載入 RichTextEditor，避免 server-side 引入 react-quill-new
export const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-[#E5E5E5] bg-gray-50">
        <span className="text-gray-400">載入編輯器中...</span>
      </div>
    ),
  }
)

export { TagSelector } from './TagSelector'
export { ImageUploader } from './ImageUploader'
