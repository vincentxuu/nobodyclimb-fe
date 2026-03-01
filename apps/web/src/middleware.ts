import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // 排除 API routes、靜態檔案、Next.js 內部路由
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
