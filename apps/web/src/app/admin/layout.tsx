'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/api/services'
import {
  Bell,
  LayoutDashboard,
  ArrowLeft,
  Loader2,
  Home,
  Users,
  FolderOpen,
  Megaphone,
  BarChart3,
  FileText,
  Menu,
  X,
  Mountain,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navLinks = [
  { href: '/admin', label: '總覽', icon: Home },
  { href: '/admin/notifications', label: '通知監控', icon: Bell },
  { href: '/admin/users', label: '用戶管理', icon: Users },
  { href: '/admin/content', label: '內容管理', icon: FolderOpen },
  { href: '/admin/crags', label: '岩場管理', icon: Mountain },
  { href: '/admin/broadcast', label: '廣播通知', icon: Megaphone },
  { href: '/admin/analytics', label: '數據分析', icon: BarChart3 },
  { href: '/admin/logs', label: '訪問日誌', icon: FileText },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await authService.getCurrentUser()
        if (response.success && response.data) {
          const user = response.data as { role?: string }
          setIsAdmin(user.role === 'admin')
        } else {
          setIsAdmin(false)
        }
      } catch {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  // 路由變化時關閉手機選單
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-wb-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wb-50" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-wb-10 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-wb-100 mb-2">存取被拒絕</h1>
          <p className="text-wb-70 mb-4">您沒有權限存取此頁面</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-wb-10">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-wb-20 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* 左側：返回 + 標題 */}
            <div className="flex items-center gap-3 md:gap-6">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-wb-70 hover:text-wb-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">返回網站</span>
              </Link>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-wb-100" />
                <span className="font-semibold text-wb-100">管理後台</span>
              </div>
            </div>

            {/* 桌面版導航 */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-wb-10 text-wb-100 font-medium'
                      : 'text-wb-70 hover:text-wb-100 hover:bg-wb-10'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* 手機版選單按鈕 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors"
              aria-label="開啟選單"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 手機版下拉選單 */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-wb-20 bg-white">
            <div className="px-4 py-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-wb-10 text-wb-100 font-medium'
                      : 'text-wb-70 hover:text-wb-100 hover:bg-wb-10'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
