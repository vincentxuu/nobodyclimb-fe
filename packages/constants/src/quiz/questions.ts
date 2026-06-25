import type { QuizAxis, QuizQuestion } from '@nobodyclimb/types'

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  // 題目交錯排列：跨軸 (body→motive→mind) + 左右方向交替
  // Round 1: body-l, motive-l, mind-l
  {
    id: 'body-l1',
    axis: 'body',
    direction: 'left',
    textZh: '我喜歡用力量直接拉上去，而不是慢慢找腳點',
    order: 1,
  },
  {
    id: 'motive-l1',
    axis: 'motive',
    direction: 'left',
    textZh: '我會設定明確的攀岩等級目標並努力達成',
    order: 2,
  },
  {
    id: 'mind-l1',
    axis: 'mind',
    direction: 'left',
    textZh: '我願意嘗試可能會墜落的高難度動作',
    order: 3,
  },
  // Round 2: body-r, motive-r, mind-r
  {
    id: 'body-r1',
    axis: 'body',
    direction: 'right',
    textZh: '我會花很多時間研究腳點的位置和踩法',
    order: 4,
  },
  {
    id: 'motive-r1',
    axis: 'motive',
    direction: 'right',
    textZh: '我攀岩主要是為了享受過程，不太在意等級',
    order: 5,
  },
  {
    id: 'mind-r1',
    axis: 'mind',
    direction: 'right',
    textZh: '我會先觀察整條路線再開始攀爬',
    order: 6,
  },
  // Round 3: body-l, motive-l, mind-l
  {
    id: 'body-l2',
    axis: 'body',
    direction: 'left',
    textZh: '我覺得鍛鍊肌力比練習平衡更有效率',
    order: 7,
  },
  {
    id: 'motive-l2',
    axis: 'motive',
    direction: 'left',
    textZh: '完攀一條目標路線會讓我非常有成就感',
    order: 8,
  },
  {
    id: 'mind-l2',
    axis: 'mind',
    direction: 'left',
    textZh: '我喜歡在沒有完全準備好的情況下挑戰新路線',
    order: 9,
  },
  // Round 4: body-r, motive-r, mind-r
  {
    id: 'body-r2',
    axis: 'body',
    direction: 'right',
    textZh: '我認為好的技巧比蠻力更能突破難關',
    order: 10,
  },
  {
    id: 'motive-r2',
    axis: 'motive',
    direction: 'right',
    textZh: '我喜歡嘗試各種不同風格的路線',
    order: 11,
  },
  {
    id: 'mind-r2',
    axis: 'mind',
    direction: 'right',
    textZh: '我偏好從簡單的路線開始慢慢加難度',
    order: 12,
  },
  // Round 5: body-l, motive-l, mind-l
  {
    id: 'body-l3',
    axis: 'body',
    direction: 'left',
    textZh: '遇到動態動作時我會感到興奮',
    order: 13,
  },
  {
    id: 'motive-l3',
    axis: 'motive',
    direction: 'left',
    textZh: '我會為了突破某個難度而反覆練習特定動作',
    order: 14,
  },
  {
    id: 'mind-l3',
    axis: 'mind',
    direction: 'left',
    textZh: '我覺得墜落是攀岩的一部分，不需要害怕',
    order: 15,
  },
  // Round 6: body-r, motive-r, mind-r
  {
    id: 'body-r3',
    axis: 'body',
    direction: 'right',
    textZh: '我喜歡用巧妙的身體擺位來節省力氣',
    order: 16,
  },
  {
    id: 'motive-r3',
    axis: 'motive',
    direction: 'right',
    textZh: '比起反覆練同一條路線，我更想探索新路線',
    order: 17,
  },
  {
    id: 'mind-r3',
    axis: 'mind',
    direction: 'right',
    textZh: '我會確保每個動作都穩定後才繼續往上',
    order: 18,
  },
  // Round 7: body-l, motive-l, mind-l
  {
    id: 'body-l4',
    axis: 'body',
    direction: 'left',
    textZh: '我偏好需要大幅拉伸或跳躍的路線',
    order: 19,
  },
  {
    id: 'motive-l4',
    axis: 'motive',
    direction: 'left',
    textZh: '我喜歡追蹤自己的攀登紀錄和進步曲線',
    order: 20,
  },
  {
    id: 'mind-l4',
    axis: 'mind',
    direction: 'left',
    textZh: '遇到未知的路線我會直接嘗試，而不是先觀察很久',
    order: 21,
  },
  // Round 8: body-r, motive-r, mind-r
  {
    id: 'body-r4',
    axis: 'body',
    direction: 'right',
    textZh: '我更享受需要精細腳法的垂直或薄片路線',
    order: 22,
  },
  {
    id: 'motive-r4',
    axis: 'motive',
    direction: 'right',
    textZh: '我覺得攀岩最棒的部分是和朋友一起的時光',
    order: 23,
  },
  {
    id: 'mind-r4',
    axis: 'mind',
    direction: 'right',
    textZh: '我認為做好充分準備比冒險嘗試更重要',
    order: 24,
  },
]

export function getQuestionsByAxis(axis: QuizAxis): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => q.axis === axis)
}
