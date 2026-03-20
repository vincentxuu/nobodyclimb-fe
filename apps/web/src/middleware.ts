import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  // 匹配所有路徑，排除 _next 靜態資源、api routes、圖片等
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
