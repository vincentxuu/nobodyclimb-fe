'use client'

import InstagramEmbed from '@/components/instagram/instagram-embed'
import InstagramEmbedSDK from '@/components/instagram/instagram-embed-sdk'

export default function InstagramFinalComparison() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* 標題 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Instagram 嵌入方法最終對比</h1>
          <p className="mt-3 text-lg text-gray-600">比較 iframe 與官方 Embed.js SDK 的差異</p>
        </div>

        {/* 對比展示 */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 方法 1: iframe */}
          <div>
            <div className="mb-4 rounded-lg bg-blue-50 p-4">
              <h2 className="mb-2 text-xl font-bold text-blue-900">方法 1: iframe 嵌入</h2>
              <p className="text-sm text-blue-700">
                簡單直接，但內容受限於 Instagram 提供的 iframe
              </p>
            </div>

            <div className="rounded-lg border-2 border-blue-200 bg-white p-6">
              <InstagramEmbed url="https://www.instagram.com/p/DPsB9hjEpzB/" height={700} />

              <div className="mt-6 rounded bg-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700">特點：</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>✅ 實作簡單</li>
                  <li>✅ 載入快速</li>
                  <li>⚠️ 內容由 Instagram 控制</li>
                  <li>⚠️ 可能只顯示部分資訊</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 方法 2: Instagram Embed.js SDK */}
          <div>
            <div className="mb-4 rounded-lg bg-green-50 p-4">
              <h2 className="mb-2 text-xl font-bold text-green-900">
                方法 2: Instagram Embed.js SDK ⭐
              </h2>
              <p className="text-sm text-green-700">Instagram 官方推薦，顯示完整的原始貼文內容</p>
            </div>

            <div className="rounded-lg border-2 border-green-200 bg-white p-6">
              <InstagramEmbedSDK url="https://www.instagram.com/p/DPsB9hjEpzB/" captioned={true} />

              <div className="mt-6 rounded bg-gray-100 p-4">
                <p className="text-sm font-semibold text-gray-700">特點：</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>✅ Instagram 官方支援</li>
                  <li>✅ 顯示完整貼文內容</li>
                  <li>✅ 包含文字、按讚數、留言數</li>
                  <li>✅ 自動響應式設計</li>
                  <li>✅ 不需手動輸入資料</li>
                  <li>⚠️ 需要載入額外 SDK</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 程式碼對比 */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* iframe 程式碼 */}
          <div className="rounded-lg bg-gray-900 p-6 text-white">
            <h3 className="mb-3 text-lg font-bold">方法 1: iframe 程式碼</h3>
            <pre className="overflow-x-auto text-xs">
              {`<InstagramEmbed
  url="https://www.instagram.com/p/DQ0D25cE4Wa/"
  height={700}
/>`}
            </pre>
          </div>

          {/* SDK 程式碼 */}
          <div className="rounded-lg bg-gray-900 p-6 text-white">
            <h3 className="mb-3 text-lg font-bold">方法 2: SDK 程式碼 ⭐</h3>
            <pre className="overflow-x-auto text-xs">
              {`<InstagramEmbedSDK
  url="https://www.instagram.com/p/DQ0D25cE4Wa/"
  captioned={true}
/>`}
            </pre>
          </div>
        </div>

        {/* 推薦說明 */}
        <div className="mt-12 rounded-lg border-2 border-green-300 bg-green-50 p-8">
          <h2 className="mb-4 text-2xl font-bold text-green-900">
            ✨ 推薦使用：Instagram Embed.js SDK
          </h2>
          <div className="space-y-3 text-green-800">
            <p>
              <strong>為什麼推薦官方 SDK？</strong>
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>完整內容顯示</strong>：SDK 會顯示 Instagram 原始貼文的所有資訊，
                包括圖片、文字、使用者名稱、按讚數、留言數等
              </li>
              <li>
                <strong>不需要手動資料</strong>：不需要從資料庫或 API 讀取貼文資訊， Instagram SDK
                會自動獲取並顯示
              </li>
              <li>
                <strong>官方支援</strong>：這是 Instagram 官方推薦的嵌入方式， 穩定性和相容性最佳
              </li>
              <li>
                <strong>自動更新</strong>：按讚數、留言數等資訊會自動更新到最新狀態
              </li>
            </ul>
          </div>
        </div>

        {/* 使用建議 */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-3 text-xl font-bold text-blue-900">💡 使用建議</h3>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold">✅ 適合使用 SDK 的情況：</p>
              <ul className="ml-6 mt-1 list-disc">
                <li>想要顯示完整的 Instagram 貼文內容</li>
                <li>不想自己維護貼文資料</li>
                <li>需要最新的按讚數、留言數</li>
                <li>展示公開的 Instagram 貼文</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">⚠️ 適合使用 iframe 的情況：</p>
              <ul className="ml-6 mt-1 list-disc">
                <li>需要最簡單的實作方式</li>
                <li>不需要完整的貼文資訊</li>
                <li>想要更快的載入速度</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 實作步驟 */}
        <div className="mt-8 rounded-lg bg-purple-50 p-6">
          <h3 className="mb-3 text-xl font-bold text-purple-900">🚀 如何在專案中使用</h3>
          <div className="space-y-3 text-sm text-purple-800">
            <p className="font-semibold">步驟 1: 使用元件</p>
            <pre className="overflow-x-auto rounded bg-purple-100 p-3 text-xs">
              {`import InstagramEmbedSDK from '@/components/instagram/instagram-embed-sdk'

<InstagramEmbedSDK url="https://www.instagram.com/p/YOUR_POST_ID/" />`}
            </pre>

            <p className="mt-4 font-semibold">步驟 2: 在岩場頁面整合</p>
            <pre className="overflow-x-auto rounded bg-purple-100 p-3 text-xs">
              {`// 在岩場詳情頁
const instagramUrls = [
  'https://www.instagram.com/p/POST_1/',
  'https://www.instagram.com/p/POST_2/',
  'https://www.instagram.com/p/POST_3/',
]

<section>
  <h2>Instagram 攀登紀錄</h2>
  <div className="grid grid-cols-3 gap-6">
    {instagramUrls.map((url) => (
      <InstagramEmbedSDK key={url} url={url} />
    ))}
  </div>
</section>`}
            </pre>

            <p className="mt-4 font-semibold">就這麼簡單！✨</p>
            <p>
              不需要從 Instagram API 獲取資料，不需要資料庫儲存， Instagram SDK 會自動處理所有事情。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
