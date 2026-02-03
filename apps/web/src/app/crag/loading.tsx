export default function CragLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* 標題骨架 */}
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />

        {/* 岩場卡片骨架 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <div className="h-48 animate-pulse bg-gray-200" />
              <div className="p-4">
                <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
