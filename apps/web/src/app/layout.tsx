import React from 'react'

/**
 * 最外層 Root Layout
 * 不包含 <html> 或 <body>，由 [locale]/layout.tsx 處理
 * 此層僅作為 Next.js App Router 要求的根 layout
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
