#!/usr/bin/env node
/**
 * 將 questions-data.ts 中的題目資料匯出為 JSON 檔案
 *
 * 用途：減少 Worker bundle 大小，避免 Error 1102
 *
 * 執行方式：node scripts/export-questions-json.js
 */

const fs = require('fs')
const path = require('path')

// 讀取 questions-data.ts 並提取 QUESTIONS_DATA
const questionsDataPath = path.join(__dirname, '../src/lib/games/rope-system/questions-data.ts')
const outputDir = path.join(__dirname, '../public/data/games/rope-system')

// 確保輸出目錄存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 讀取 TypeScript 文件
const content = fs.readFileSync(questionsDataPath, 'utf-8')

// 提取 QUESTIONS_DATA 物件（簡單的正則匹配）
// 找到 export const QUESTIONS_DATA: Record<string, Question[]> = { 開始
// 到 }; 結束（需要匹配巢狀括號）
const startMarker = 'export const QUESTIONS_DATA: Record<string, Question[]> = '
const startIndex = content.indexOf(startMarker)

if (startIndex === -1) {
  console.error('找不到 QUESTIONS_DATA 定義')
  process.exit(1)
}

// 從 startMarker 後面開始找 { 的位置
const dataStart = content.indexOf('{', startIndex + startMarker.length)

// 使用計數器找到匹配的 }
let depth = 0
let dataEnd = -1
for (let i = dataStart; i < content.length; i++) {
  if (content[i] === '{') depth++
  if (content[i] === '}') depth--
  if (depth === 0) {
    dataEnd = i + 1
    break
  }
}

if (dataEnd === -1) {
  console.error('無法解析 QUESTIONS_DATA 結構')
  process.exit(1)
}

// 提取 JavaScript 物件字串
let jsObjectStr = content.slice(dataStart, dataEnd)

// 清理 TypeScript 特有的語法，轉換為有效的 JSON
// 1. 移除尾隨逗號（JSON 不允許）
jsObjectStr = jsObjectStr.replace(/,(\s*[}\]])/g, '$1')

// 2. 將單引號轉換為雙引號（JSON 需要雙引號）
// 這需要小心處理，因為字串內容可能包含單引號
// 使用 eval 來解析（因為這是合法的 JS 物件）
let questionsData
try {
  // 使用 Function 來安全地執行（比 eval 稍安全）
  questionsData = new Function(`return ${jsObjectStr}`)()
} catch (error) {
  console.error('解析 QUESTIONS_DATA 失敗:', error.message)
  process.exit(1)
}

// 將每個類別的題目分別存為獨立的 JSON 文件
const categories = Object.keys(questionsData)
console.log(`找到 ${categories.length} 個類別:`)

for (const categoryId of categories) {
  const questions = questionsData[categoryId]
  const outputPath = path.join(outputDir, `${categoryId}.json`)

  fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf-8')
  console.log(`  ✓ ${categoryId}: ${questions.length} 題 -> ${outputPath}`)
}

// 同時建立一個索引檔案（包含所有類別的統計資訊）
const indexData = {
  generatedAt: new Date().toISOString(),
  categories: categories.map(id => ({
    id,
    questionCount: questionsData[id].length
  }))
}

const indexPath = path.join(outputDir, 'index.json')
fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8')
console.log(`  ✓ index.json -> ${indexPath}`)

console.log('\n匯出完成！')
console.log(`總共 ${categories.reduce((sum, id) => sum + questionsData[id].length, 0)} 題`)
