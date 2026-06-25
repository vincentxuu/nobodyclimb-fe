import type { QuizAnswer } from '@nobodyclimb/types'
import { describe, expect, it } from 'vitest'
import { QUIZ_QUESTIONS } from '../questions'
import { calculateQuizResult } from '../scoring'

function makeAnswers(valueFn: (id: string) => 1 | 2 | 3 | 4 | 5): QuizAnswer[] {
  return QUIZ_QUESTIONS.map((q) => ({
    questionId: q.id,
    value: valueFn(q.id),
  }))
}

function allSameValue(value: 1 | 2 | 3 | 4 | 5): QuizAnswer[] {
  return makeAnswers(() => value)
}

describe('calculateQuizResult', () => {
  it('全選 5 分（非常同意）→ 各軸 left 題得 20, right 題反轉得 4 → 平手偏左 → PGB', () => {
    const result = calculateQuizResult(allSameValue(5))
    // left 題: 4 題 × 5 = 20
    // right 題: 4 題 × (6-5) = 4
    // 總分: 24, >= 24 → 取 left (P, G, B)
    expect(result.typeCode).toBe('PGB')
    expect(result.axisScores).toHaveLength(3)
  })

  it('全選 1 分（非常不同意）→ left 題得 4, right 題反轉得 20 → 總分 24 → 平手取左 → PGB', () => {
    const result = calculateQuizResult(allSameValue(1))
    // left 題: 4 題 × 1 = 4
    // right 題: 4 題 × (6-1) = 20
    // 總分: 24, >= 24 → 取 left
    expect(result.typeCode).toBe('PGB')
  })

  it('全選 3 分（中立）→ left 題得 12, right 題得 12 → 總分 24 → 平手取左 → PGB', () => {
    const result = calculateQuizResult(allSameValue(3))
    expect(result.typeCode).toBe('PGB')
  })

  it('left 題選 5, right 題選 1 → 強烈偏左 → PGB', () => {
    const result = calculateQuizResult(makeAnswers((id) => (id.includes('-l') ? 5 : 1)))
    // left 題: 4 × 5 = 20
    // right 題: 4 × (6-1) = 20
    // 總分: 40 → 偏左
    expect(result.typeCode).toBe('PGB')
    // 各軸分數應為 40
    for (const axis of result.axisScores) {
      expect(axis.score).toBe(40)
    }
  })

  it('left 題選 1, right 題選 5 → 強烈偏右 → TFS', () => {
    const result = calculateQuizResult(makeAnswers((id) => (id.includes('-l') ? 1 : 5)))
    // left 題: 4 × 1 = 4
    // right 題: 4 × (6-5) = 4
    // 總分: 8 → 偏右
    expect(result.typeCode).toBe('TFS')
    for (const axis of result.axisScores) {
      expect(axis.score).toBe(8)
    }
  })

  it('Body 偏右(T), Motive 偏左(G), Mind 偏左(B) → TGB', () => {
    const result = calculateQuizResult(
      makeAnswers((id) => {
        if (id.startsWith('body-l')) return 1
        if (id.startsWith('body-r')) return 5
        if (id.includes('-l')) return 5
        return 1
      })
    )
    expect(result.typeCode).toBe('TGB')
  })

  it('Body 偏左(P), Motive 偏右(F), Mind 偏右(S) → PFS', () => {
    const result = calculateQuizResult(
      makeAnswers((id) => {
        if (id.startsWith('body-l')) return 5
        if (id.startsWith('body-r')) return 1
        if (id.includes('-l')) return 1
        return 5
      })
    )
    expect(result.typeCode).toBe('PFS')
  })

  it('Grit 指標計算正確（Motive 軸分數 36）', () => {
    const result = calculateQuizResult(
      makeAnswers((id) => {
        if (id.startsWith('motive-l')) return 5
        if (id.startsWith('motive-r')) return 1
        return 3
      })
    )
    // motive left: 4×5=20, right: 4×(6-1)=20, total=40
    // gritIndex = (40-8)/32*100 = 100
    expect(result.gritIndex).toBeCloseTo(100, 1)
  })

  it('Flow 指標計算正確（Motive 軸分數 12）', () => {
    const result = calculateQuizResult(
      makeAnswers((id) => {
        if (id.startsWith('motive-l')) return 1
        if (id.startsWith('motive-r')) return 3
        return 3
      })
    )
    // motive left: 4×1=4, right: 4×(6-3)=12, total=16
    // flowIndex = (40-16)/32*100 = 75
    expect(result.flowIndex).toBeCloseTo(75, 1)
  })

  it('gritIndex + flowIndex = 100', () => {
    const result = calculateQuizResult(allSameValue(4))
    expect(result.gritIndex + result.flowIndex).toBeCloseTo(100, 5)
  })

  it('不同答案組合 gritIndex + flowIndex 仍然 = 100', () => {
    const result = calculateQuizResult(makeAnswers((id) => (id.includes('-l') ? 5 : 2)))
    expect(result.gritIndex + result.flowIndex).toBeCloseTo(100, 5)
  })

  it('少於 24 題時拋出錯誤', () => {
    const partial = QUIZ_QUESTIONS.slice(0, 10).map((q) => ({
      questionId: q.id,
      value: 3 as const,
    }))
    expect(() => calculateQuizResult(partial)).toThrow('24')
  })

  it('空陣列拋出錯誤', () => {
    expect(() => calculateQuizResult([])).toThrow('24')
  })

  it('百分比值在 0-100 範圍內', () => {
    const result = calculateQuizResult(makeAnswers((id) => (id.includes('-l') ? 5 : 1)))
    expect(result.bodyPercent).toBeGreaterThanOrEqual(0)
    expect(result.bodyPercent).toBeLessThanOrEqual(100)
    expect(result.motivePercent).toBeGreaterThanOrEqual(0)
    expect(result.motivePercent).toBeLessThanOrEqual(100)
    expect(result.mindPercent).toBeGreaterThanOrEqual(0)
    expect(result.mindPercent).toBeLessThanOrEqual(100)
  })

  it('回傳的 axisScores 包含三軸', () => {
    const result = calculateQuizResult(allSameValue(3))
    const axes = result.axisScores.map((a) => a.axis)
    expect(axes).toContain('body')
    expect(axes).toContain('motive')
    expect(axes).toContain('mind')
  })
})
