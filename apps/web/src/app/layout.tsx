import '@/styles/globals.css'
import React from 'react'

// Root layout 為 passthrough — <html>/<body> 由 [locale]/layout.tsx 負責
// 這讓 locale layout 能正確設定 <html lang={locale}>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
