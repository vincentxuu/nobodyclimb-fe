/**
 * 解析 LLM 回應中的建議問題，回傳純回答與建議陣列。
 * 支援兩種格式：
 * 1. 明確分隔符 `---SUGGESTIONS---`
 * 2. 末尾連續問句行自動偵測（≥2 行）
 */
export function parseSuggestedQuestions(raw: string): { answer: string; suggested_questions: string[] } {
  const SEP = '---SUGGESTIONS---';
  const idx = raw.indexOf(SEP);
  if (idx !== -1) {
    const rawAnswer = raw.slice(0, idx).trim();
    const suggestionsBlock = raw.slice(idx + SEP.length).trim();
    const suggested_questions = suggestionsBlock
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0 && (line.endsWith('？') || line.endsWith('?')))
      .slice(0, 3);

    const answerLines = rawAnswer.split('\n');
    let cutIndex = answerLines.length;
    for (let i = answerLines.length - 1; i >= 0; i--) {
      const trimmed = answerLines[i].trim();
      if (trimmed === '') continue;
      const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
      if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
        cutIndex = i;
      } else {
        break;
      }
    }
    const answer = answerLines.slice(0, cutIndex).join('\n').trim();
    // 防護：如果剝離問句後 answer 為空，保留原始回答（避免 LLM 全輸出問句導致空回答）
    return { answer: answer || rawAnswer, suggested_questions };
  }

  const lines = raw.trim().split('\n');
  const questions: string[] = [];
  let cutIndex = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '') continue;
    const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
    if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
      questions.unshift(cleaned);
      cutIndex = i;
    } else {
      break;
    }
  }
  if (questions.length >= 2) {
    const answerLines = lines.slice(0, cutIndex);
    while (answerLines.length > 0 && answerLines[answerLines.length - 1].trim() === '') {
      answerLines.pop();
    }
    const answer = answerLines.join('\n').trim();
    // 防護：如果剝離問句後 answer 為空，保留原始回答
    return { answer: answer || raw.trim(), suggested_questions: questions.slice(0, 3) };
  }
  return { answer: raw.trim(), suggested_questions: [] };
}
