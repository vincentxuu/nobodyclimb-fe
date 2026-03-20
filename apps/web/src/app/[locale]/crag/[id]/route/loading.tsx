export default function RouteLoading() {
  return (
    <div className="lg:flex lg:h-[calc(100vh-70px)] lg:overflow-hidden">
      {/* 側邊欄骨架 - 桌面版 */}
      <aside className="hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:flex-col border-r border-gray-200 bg-white">
        <div className="flex-shrink-0 border-b border-gray-200 p-4">
          <div className="mb-3 h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mb-2 h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="flex-shrink-0 border-b border-gray-200 p-4 space-y-3">
          <div className="h-10 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 animate-pulse rounded bg-gray-200" />
            <div className="h-9 flex-1 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </aside>

      {/* 主要內容區骨架 */}
      <div className="flex-1 bg-gray-50 p-4 lg:p-8">
        <div className="mx-auto max-w-4xl">
          {/* 麵包屑骨架 */}
          <div className="mb-4 h-5 w-64 animate-pulse rounded bg-gray-200" />

          {/* 內容卡片骨架 */}
          <div className="rounded-lg bg-white p-6 shadow-sm md:p-8">
            {/* 標題 */}
            <div className="mb-6">
              <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
              <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />
              <div className="flex gap-2">
                <div className="h-8 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
              </div>
            </div>

            {/* 圖片區 */}
            <div className="mb-8 aspect-video w-full animate-pulse rounded-lg bg-gray-200" />

            {/* 資訊卡片 */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>

            {/* 描述 */}
            <div className="space-y-3">
              <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
