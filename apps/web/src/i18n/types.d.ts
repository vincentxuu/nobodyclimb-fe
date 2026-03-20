import type messages from '../../messages/zh.json'

declare global {
  // next-intl 型別安全 key
  type Messages = typeof messages
  interface IntlMessages extends Messages {}
}
