import { describe, expect, it } from 'vitest'
import { toTraditionalChinese } from '../opencc'

describe('toTraditionalChinese', () => {
  it('converts simplified characters to Traditional', () => {
    expect(toTraditionalChinese('软件工程师喜欢攀岩和网络编程')).toBe(
      '軟件工程師喜歡攀岩和網絡編程'
    )
  })

  it('leaves Traditional Chinese unchanged', () => {
    const text = '運攀、抱石、傳攀都是攀岩類型'
    expect(toTraditionalChinese(text)).toBe(text)
  })

  it('keeps house-style characters (岩/台) instead of OpenCC formal variants (巖/臺)', () => {
    expect(toTraditionalChinese('这个岩场在台湾很有名')).toBe('這個岩場在台灣很有名')
  })

  it('handles empty string', () => {
    expect(toTraditionalChinese('')).toBe('')
  })
})
