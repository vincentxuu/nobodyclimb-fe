#!/usr/bin/env node
/**
 * 將 Markdown 題庫轉換為 TypeScript 格式
 *
 * 使用方式：
 *   node scripts/convert-questions.js
 *
 * 輸出：
 *   src/lib/games/rope-system/questions-data.ts
 */

const fs = require('fs');
const path = require('path');

const QUESTIONS_DIR = path.join(__dirname, '../docs/games/rope-system/questions');
const OUTPUT_FILE = path.join(__dirname, '../src/lib/games/rope-system/questions-data.ts');

// 類別 ID 對應檔案名稱
const CATEGORY_MAP = {
  'sport-01-belay.md': 'sport-belay',
  'sport-02-lead.md': 'sport-lead',
  'sport-03-toprope.md': 'sport-toprope',
  'sport-04-rappel.md': 'sport-rappel',
  'trad-01-anchor.md': 'trad-anchor',
  'trad-02-protection.md': 'trad-protection',
  'trad-03-multipitch.md': 'trad-multipitch',
  'trad-04-rescue.md': 'trad-rescue',
};

/**
 * 計算難度（星星數量）
 */
function parseDifficulty(text) {
  const stars = (text.match(/⭐/g) || []).length;
  return Math.min(Math.max(stars, 1), 3); // 限制在 1-3
}

/**
 * 解析選項
 */
function parseOptions(text) {
  const options = [];
  const optionRegex = /- ([A-D])\.\s*(.+)/g;
  let match;

  while ((match = optionRegex.exec(text)) !== null) {
    options.push({
      id: match[1].toLowerCase(),
      text: match[2].trim(),
    });
  }

  return options;
}

/**
 * 解析正確答案
 */
function parseCorrectAnswer(text) {
  // 處理排序題（多個答案）
  const orderMatch = text.match(/([A-D])\s*[→>]\s*([A-D])\s*[→>]\s*([A-D])\s*[→>]\s*([A-D])/i);
  if (orderMatch) {
    return [
      orderMatch[1].toLowerCase(),
      orderMatch[2].toLowerCase(),
      orderMatch[3].toLowerCase(),
      orderMatch[4].toLowerCase(),
    ];
  }

  // 單選題
  const singleMatch = text.match(/([A-D])/i);
  if (singleMatch) {
    return singleMatch[1].toLowerCase();
  }

  return 'a';
}

/**
 * 清理文字（移除 Markdown 格式）
 */
function cleanText(text) {
  if (!text) return '';

  return text
    .replace(/\*\*/g, '') // 移除粗體
    .replace(/`([^`]+)`/g, '$1') // 移除行內程式碼
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除連結，保留文字
    .replace(/^\s*[-*]\s*/gm, '') // 移除列表符號
    .replace(/\n{3,}/g, '\n\n') // 減少多餘換行
    .trim();
}

/**
 * 解析單一題目區塊
 */
function parseQuestion(block, categoryId, questionNumber) {
  const question = {
    id: `${categoryId}-${questionNumber}`,
    categoryId,
    type: 'choice',
    difficulty: 1,
    question: '',
    options: [],
    correctAnswer: 'a',
  };

  // 解析難度
  const difficultyMatch = block.match(/\*\*難度\*\*[：:]\s*([⭐]+)/);
  if (difficultyMatch) {
    question.difficulty = parseDifficulty(difficultyMatch[1]);
  }

  // 解析情境
  const scenarioMatch = block.match(/\*\*情境\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*問題\*\*)/);
  if (scenarioMatch) {
    question.scenario = cleanText(scenarioMatch[1]);
    question.type = 'situation';
  }

  // 解析問題
  const questionMatch = block.match(/\*\*問題\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*選項\*\*)/);
  if (questionMatch) {
    question.question = cleanText(questionMatch[1]);

    // 檢查是否為排序題
    if (question.question.includes('排列') || question.question.includes('順序') || question.question.includes('依序')) {
      question.type = 'ordering';
    }
  }

  // 解析選項
  const optionsMatch = block.match(/\*\*選項\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*正確答案\*\*)/);
  if (optionsMatch) {
    question.options = parseOptions(optionsMatch[1]);
  }

  // 解析正確答案
  const answerMatch = block.match(/\*\*正確答案\*\*[：:]\s*(.+)/);
  if (answerMatch) {
    question.correctAnswer = parseCorrectAnswer(answerMatch[1]);

    // 如果是陣列答案，確認類型為 ordering
    if (Array.isArray(question.correctAnswer)) {
      question.type = 'ordering';
    }
  }

  // 解析解釋
  const explanationMatch = block.match(/\*\*解釋\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*參考來源\*\*|\n\n\*\*標籤\*\*|\n\n---|\n\n## |$)/);
  if (explanationMatch) {
    question.explanation = cleanText(explanationMatch[1]);
  }

  // 解析參考來源
  const referencesMatch = block.match(/\*\*參考來源\*\*[：:]\s*(.+)/);
  if (referencesMatch) {
    question.referenceSources = referencesMatch[1]
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 解析標籤
  const tagsMatch = block.match(/\*\*標籤\*\*[：:]\s*(.+)/);
  if (tagsMatch) {
    question.tags = tagsMatch[1]
      .replace(/`/g, '')
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  return question;
}

/**
 * 解析 Markdown 檔案
 */
function parseMarkdownFile(filePath, categoryId) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions = [];

  // 用 ## Q 分割題目
  const questionBlocks = content.split(/(?=## Q\d+:)/);

  for (const block of questionBlocks) {
    // 確認是題目區塊
    const questionNumMatch = block.match(/## Q(\d+):/);
    if (!questionNumMatch) continue;

    const questionNumber = parseInt(questionNumMatch[1], 10);
    const question = parseQuestion(block, categoryId, questionNumber);

    // 驗證題目有效性
    if (question.question && question.options.length >= 2) {
      questions.push(question);
    } else {
      console.warn(`  警告: Q${questionNumber} 解析不完整，已跳過`);
    }
  }

  return questions;
}

/**
 * 生成 TypeScript 程式碼
 */
function generateTypeScript(allQuestions) {
  const lines = [
    '/**',
    ' * 攀岩系統練習遊戲 - 題目資料',
    ' * ',
    ' * 此檔案由 scripts/convert-questions.js 自動生成',
    ' * 請勿手動編輯，如需修改請編輯 docs/games/rope-system/questions/ 中的 Markdown 檔案',
    ' * ',
    ` * 生成時間: ${new Date().toISOString()}`,
    ' */',
    '',
    "import type { Question } from './types'",
    '',
    '/** 所有題目資料，按類別分組 */',
    'export const QUESTIONS_DATA: Record<string, Question[]> = {',
  ];

  for (const [categoryId, questions] of Object.entries(allQuestions)) {
    lines.push(`  '${categoryId}': [`);

    for (const q of questions) {
      lines.push('    {');
      lines.push(`      id: '${q.id}',`);
      lines.push(`      categoryId: '${q.categoryId}',`);
      lines.push(`      type: '${q.type}',`);
      lines.push(`      difficulty: ${q.difficulty},`);

      if (q.scenario) {
        lines.push(`      scenario: ${JSON.stringify(q.scenario)},`);
      }

      lines.push(`      question: ${JSON.stringify(q.question)},`);
      lines.push('      options: [');

      for (const opt of q.options) {
        lines.push(`        { id: '${opt.id}', text: ${JSON.stringify(opt.text)} },`);
      }

      lines.push('      ],');

      if (Array.isArray(q.correctAnswer)) {
        lines.push(`      correctAnswer: [${q.correctAnswer.map(a => `'${a}'`).join(', ')}],`);
      } else {
        lines.push(`      correctAnswer: '${q.correctAnswer}',`);
      }

      if (q.explanation) {
        lines.push(`      explanation: ${JSON.stringify(q.explanation)},`);
      }

      if (q.referenceSources && q.referenceSources.length > 0) {
        lines.push(`      referenceSources: [${q.referenceSources.map(s => JSON.stringify(s)).join(', ')}],`);
      }

      if (q.tags && q.tags.length > 0) {
        lines.push(`      tags: [${q.tags.map(t => JSON.stringify(t)).join(', ')}],`);
      }

      lines.push('    },');
    }

    lines.push('  ],');
  }

  lines.push('};');
  lines.push('');
  lines.push('/** 取得指定類別的題目 */');
  lines.push('export function getQuestionsByCategory(categoryId: string): Question[] {');
  lines.push('  return QUESTIONS_DATA[categoryId] || [];');
  lines.push('}');
  lines.push('');
  lines.push('/** 取得所有類別的題目數量統計 */');
  lines.push('export function getQuestionStats(): Record<string, number> {');
  lines.push('  const stats: Record<string, number> = {};');
  lines.push('  for (const [categoryId, questions] of Object.entries(QUESTIONS_DATA)) {');
  lines.push('    stats[categoryId] = questions.length;');
  lines.push('  }');
  lines.push('  return stats;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * 主程式
 */
function main() {
  console.log('開始轉換題庫...\n');

  const allQuestions = {};
  let totalQuestions = 0;

  // 讀取所有 Markdown 檔案
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');

  for (const file of files) {
    const categoryId = CATEGORY_MAP[file];
    if (!categoryId) {
      console.log(`跳過: ${file} (無對應類別)`);
      continue;
    }

    console.log(`處理: ${file} -> ${categoryId}`);

    const filePath = path.join(QUESTIONS_DIR, file);
    const questions = parseMarkdownFile(filePath, categoryId);

    allQuestions[categoryId] = questions;
    totalQuestions += questions.length;

    console.log(`  -> ${questions.length} 題\n`);
  }

  // 生成 TypeScript 檔案
  const tsContent = generateTypeScript(allQuestions);
  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');

  console.log('='.repeat(40));
  console.log(`轉換完成！`);
  console.log(`總計: ${Object.keys(allQuestions).length} 個類別, ${totalQuestions} 題`);
  console.log(`輸出: ${OUTPUT_FILE}`);
}

main();
