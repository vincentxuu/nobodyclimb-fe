import { D1Database } from '@cloudflare/workers-types';

// =============================================
// GuardrailError
// =============================================

export class GuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardrailError';
  }
}

// =============================================
// 輸入層防護
// =============================================

const PROMPT_INJECTION_KEYWORDS = [
  'ignore previous instructions',
  'ignore all instructions',
  'disregard previous',
  'you are now',
  'you are no longer',
  'pretend to be',
  'pretend you are',
  'act as if you are',
  'jailbreak',
  'dan mode',
  'developer mode',
  'override instructions',
  'bypass restrictions',
];

const JAILBREAK_PATTERNS = [
  'act as ',
  'roleplay as',
  'role play as',
  'simulate being',
  'simulate a',
  '扮演',
  '假裝你是',
  '假裝是',
  '模擬你是',
  '你現在是',
  '忽略之前',
  '忽略所有指令',
];

// 純符號（非字母、數字、中文、日文、韓文）
const MEANINGLESS_SYMBOLS_RE = /^[^\w\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]+$/;
// 10 個以上相同字元連續
const REPEATED_CHARS_RE = /(.)\1{9,}/;

export interface GuardrailsInputTrace {
  passed: boolean;
  checks_run: string[];
  triggered_check: string | null;
  triggered_keyword: string | null;
  query_length: number;
  blocklist_size: number;
}

/**
 * 輸入層防護：在 LLM 呼叫前驗證查詢是否合規
 * 驗證失敗時拋出 GuardrailError，呼叫方返回 400 且不扣配額
 * 通過時回傳 GuardrailsInputTrace 供 pipeline trace 使用
 */
export async function checkInput(query: string, db: D1Database): Promise<GuardrailsInputTrace> {
  const lowerQuery = query.toLowerCase();
  const checks_run: string[] = [];

  // 1. Prompt injection 關鍵字過濾
  checks_run.push('prompt_injection');
  for (const keyword of PROMPT_INJECTION_KEYWORDS) {
    if (lowerQuery.includes(keyword)) {
      throw new GuardrailError('輸入內容不符合使用規範');
    }
  }

  // 2. Jailbreak pattern 偵測
  checks_run.push('jailbreak');
  for (const pattern of JAILBREAK_PATTERNS) {
    if (lowerQuery.includes(pattern.toLowerCase())) {
      throw new GuardrailError('輸入內容不符合使用規範');
    }
  }

  // 3. 無效輸入：純符號或連續重複字元
  checks_run.push('meaningless');
  const trimmed = query.trim();
  if (MEANINGLESS_SYMBOLS_RE.test(trimmed) || REPEATED_CHARS_RE.test(trimmed)) {
    throw new GuardrailError('輸入內容無效，請輸入有意義的問題');
  }

  // 4. 動態黑名單：從 ai_config 載入
  checks_run.push('blocklist');
  let blocklistSize = 0;
  try {
    const row = await db
      .prepare(`SELECT value FROM ai_config WHERE key = 'input_blocklist' LIMIT 1`)
      .first<{ value: string }>();
    if (row?.value) {
      const customList = JSON.parse(row.value) as string[];
      blocklistSize = customList.length;
      for (const keyword of customList) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          throw new GuardrailError('輸入內容不符合使用規範');
        }
      }
    }
  } catch (err) {
    if (err instanceof GuardrailError) throw err;
    // ai_config 讀取失敗時靜默略過，不影響正常流程
  }

  return {
    passed: true,
    checks_run,
    triggered_check: null,
    triggered_keyword: null,
    query_length: query.length,
    blocklist_size: blocklistSize,
  };
}

// =============================================
// 輸出層防護
// =============================================

const SYSTEM_PROMPT_LEAKAGE_PATTERNS = [
  'SYSTEM_PROMPT',
  'You are a climbing assistant',
  '你是一個攀岩助理',
  '你是攀岩助理',
  'system prompt',
  '<system>',
  '[SYSTEM]',
];

const OUTPUT_REPLACEMENT_MESSAGE = '抱歉，回答過程發生錯誤，請重新提問。';
const MAX_OUTPUT_LENGTH = 3000;
const OUTPUT_TRUNCATION_SUFFIX = '…（回答已截斷，請縮短問題或分多次詢問）';

const PII_PATTERNS: { re: RegExp; replacement: string }[] = [
  { re: /\S+@\S+\.\S+/g, replacement: '[已隱藏]' },
  { re: /\b0\d{1,2}-?\d{6,8}\b/g, replacement: '[已隱藏]' },
];

export interface GuardrailsOutputTrace {
  original_length: number;
  output_length: number;
  system_prompt_leaked: boolean;
  pii_count: number;
  truncated: boolean;
}

/**
 * 輸出層防護：掃描 LLM 回應，過濾 leakage、PII，並截斷過長回應
 * 回傳 { output, trace } 供 pipeline trace 使用
 */
export function checkOutput(response: string): { output: string; trace: GuardrailsOutputTrace } {
  const originalLength = response.length;
  let result = response;
  let piiCount = 0;

  // 1. System prompt leakage 偵測
  const lowerResult = result.toLowerCase();
  for (const pattern of SYSTEM_PROMPT_LEAKAGE_PATTERNS) {
    if (lowerResult.includes(pattern.toLowerCase())) {
      console.warn('[guardrails] system prompt leakage detected');
      return {
        output: OUTPUT_REPLACEMENT_MESSAGE,
        trace: {
          original_length: originalLength,
          output_length: OUTPUT_REPLACEMENT_MESSAGE.length,
          system_prompt_leaked: true,
          pii_count: 0,
          truncated: false,
        },
      };
    }
  }

  // 2. PII 過濾
  for (const { re, replacement } of PII_PATTERNS) {
    const matches = result.match(re);
    if (matches) piiCount += matches.length;
    result = result.replace(re, replacement);
  }

  // 3. 回應長度截斷
  const truncated = result.length > MAX_OUTPUT_LENGTH;
  if (truncated) {
    result = result.slice(0, MAX_OUTPUT_LENGTH) + OUTPUT_TRUNCATION_SUFFIX;
  }

  return {
    output: result,
    trace: {
      original_length: originalLength,
      output_length: result.length,
      system_prompt_leaked: false,
      pii_count: piiCount,
      truncated,
    },
  };
}
