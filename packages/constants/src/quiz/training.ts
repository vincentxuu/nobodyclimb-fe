import type { PersonalityTypeCode, TrainingPlan } from '@nobodyclimb/types'

/**
 * 八種攀岩人格類型的四週訓練計畫
 * 每個計畫：4 週 × 3 天，每天 2-3 個練習
 */
export const TRAINING_PLANS: Record<PersonalityTypeCode, TrainingPlan> = {
  // 碎岩者（Crusher）：力量與爆發力
  PGB: {
    typeCode: 'PGB',
    weeks: [
      {
        weekNumber: 1,
        theme: '建立力量基礎',
        days: [
          {
            dayNumber: 1,
            title: '最大力量啟動',
            description: '以中等強度喚醒肌群，建立後續爆發訓練的基礎。',
            duration: 60,
            exercises: [
              {
                name: '指力板訓練',
                description: '七秒掛、三秒休，重複六組，選擇能完成的最小握點。',
              },
              { name: '核心訓練', description: '懸吊抬腿與平板撐共四組，維持骨盆穩定。' },
              { name: '拮抗肌訓練', description: '伏地挺身與肩推各三組，平衡推拉肌群。' },
            ],
          },
          {
            dayNumber: 2,
            title: '抱石力量循環',
            description: '以中等難度抱石路線累積力量耐受度。',
            duration: 75,
            exercises: [
              {
                name: '抱石',
                description: '選擇能完成但具挑戰的路線，攀爬八條，每條間休息三分鐘。',
              },
              { name: '核心訓練', description: '前控與側棒各三組，強化攀爬時的身體張力。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與柔軟度',
            description: '主動恢復日，維持關節活動度避免代償。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '髖關節與肩關節伸展，每個動作維持三十秒。' },
              { name: '拮抗肌訓練', description: '手腕與前臂伸肌訓練，預防指屈肌過度緊繃。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '發展爆發力',
        days: [
          {
            dayNumber: 1,
            title: '校園板入門',
            description: '導入動態爆發動作，提升出手速度。',
            duration: 60,
            exercises: [
              { name: '校園板', description: '一到三的階梯上移，三組，著重落點精準而非速度。' },
              { name: '核心訓練', description: '懸吊收腹與旋轉控制各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '動態抱石',
            description: '練習 dyno 與大跨距動作，訓練全身協調爆發。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '挑選含跳躍與大移動的路線，反覆嘗試六條。' },
              { name: '指力板訓練', description: '半捏掛兩秒掛訓練，五組，強化開放握力。' },
              { name: '柔軟度訓練', description: '高抬腿與壓腿，提升動態動作的活動範圍。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '輕量活動促進血液循環。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展流程，搭配深呼吸放鬆。' },
              { name: '拮抗肌訓練', description: '輕重量肩外旋訓練，維護肩部健康。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '高強度爆發',
        days: [
          {
            dayNumber: 1,
            title: '最大爆發輸出',
            description: '以高強度低次數刺激爆發力上限。',
            duration: 75,
            exercises: [
              {
                name: '校園板',
                description: '跳階上移與雙手起跳，每組三次，共五組，組間充分休息。',
              },
              { name: '指力板訓練', description: '加重最大掛訓練，五秒掛搭配負重背心，四組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '極限抱石專案',
            description: '投入接近極限的路線，逼出爆發潛力。',
            duration: 90,
            exercises: [
              { name: '抱石', description: '選定一條接近極限的專案路線，分解動作反覆嘗試。' },
              { name: '核心訓練', description: '懸體支撐與動態收腹各三組，支撐爆發後的身體控制。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '高強度週的必要恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆前臂與背部，搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練，避免肌力失衡。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合與測試',
        days: [
          {
            dayNumber: 1,
            title: '力量整合',
            description: '將力量與爆發整合進實際攀爬。',
            duration: 60,
            exercises: [
              { name: '抱石', description: '混合力量型與動態型路線各四條，檢驗本月成果。' },
              { name: '核心訓練', description: '綜合核心循環兩輪，維持攀爬張力。' },
            ],
          },
          {
            dayNumber: 2,
            title: '極限測試',
            description: '嘗試突破個人最高難度。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '挑戰比本月起點高一級的路線，記錄完攀情況。' },
              { name: '指力板訓練', description: '測試最大掛重，記錄進步幅度。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操與檢討',
            description: '完整恢復並回顧訓練。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展流程，放鬆累積的疲勞。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練，為下一週期做準備。' },
            ],
          },
        ],
      },
    ],
  },

  // 鍛造者（Forger）：力量與耐力漸進
  PGS: {
    typeCode: 'PGS',
    weeks: [
      {
        weekNumber: 1,
        theme: '系統化力量基礎',
        days: [
          {
            dayNumber: 1,
            title: '基礎力量建立',
            description: '以漸進負荷建立扎實的力量基礎。',
            duration: 60,
            exercises: [
              { name: '指力板訓練', description: '十秒掛、五秒休，六組，記錄每組握點以追蹤進度。' },
              { name: '核心訓練', description: '平板撐與側棒各三組，建立基礎軀幹穩定。' },
              { name: '拮抗肌訓練', description: '伏地挺身與划船各三組，平衡上肢肌群。' },
            ],
          },
          {
            dayNumber: 2,
            title: '耐力鋪墊',
            description: '以中低強度長時間攀爬累積基礎耐力。',
            duration: 75,
            exercises: [
              {
                name: '先鋒攀登',
                description: '選擇能輕鬆完攀的路線，連續攀爬四趟，著重節奏穩定。',
              },
              { name: '核心訓練', description: '懸吊抬腿三組，強化持續攀爬的核心支撐。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與活動度',
            description: '維持關節健康，支撐後續漸進負荷。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '髖與肩伸展流程，每動作維持三十秒。' },
              { name: '拮抗肌訓練', description: '前臂伸肌訓練，預防指力訓練造成的失衡。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '漸進負荷發展',
        days: [
          {
            dayNumber: 1,
            title: '增量力量',
            description: '在上週基礎上提升負荷強度。',
            duration: 65,
            exercises: [
              { name: '指力板訓練', description: '改用更小握點或加輕負重，七秒掛六組。' },
              { name: '核心訓練', description: '前控與懸吊收腹各三組，提升強度。' },
            ],
          },
          {
            dayNumber: 2,
            title: '耐力循環',
            description: '延長攀爬時間，建立中強度耐力。',
            duration: 80,
            exercises: [
              {
                name: '抱石',
                description: '連續攀爬中等難度路線十條，組間僅短暫休息，模擬耐力負荷。',
              },
              { name: '先鋒攀登', description: '完攀兩條中等長度路線，著重不放手休息。' },
              { name: '柔軟度訓練', description: '腿後與髖部伸展，維持動作經濟性。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '促進恢復避免累積疲勞。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展搭配深呼吸放鬆。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋與手腕訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '力量耐力強化',
        days: [
          {
            dayNumber: 1,
            title: '高強度力量',
            description: '接近最大強度的力量刺激。',
            duration: 70,
            exercises: [
              { name: '指力板訓練', description: '加重最大掛，五秒掛搭配負重，五組。' },
              { name: '核心訓練', description: '懸體支撐與旋轉控制各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '力量耐力整合',
            description: '在疲勞狀態下維持力量輸出。',
            duration: 85,
            exercises: [
              {
                name: '先鋒攀登',
                description: '連續完攀三條長路線，最後一條挑戰個人接近極限難度。',
              },
              { name: '抱石', description: '疲勞後仍攀爬八條中難度路線，訓練耐力底。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '高強度週的恢復管理。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆前臂與背肌，搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合與評估',
        days: [
          {
            dayNumber: 1,
            title: '綜合整合',
            description: '整合力量與耐力於完整攀爬。',
            duration: 65,
            exercises: [
              { name: '先鋒攀登', description: '完攀兩條結合力量與耐力的路線，檢驗本月成果。' },
              { name: '核心訓練', description: '綜合核心循環兩輪。' },
            ],
          },
          {
            dayNumber: 2,
            title: '進度測試',
            description: '評估力量與耐力的進步。',
            duration: 75,
            exercises: [
              { name: '指力板訓練', description: '測試最大掛重，對照第一週記錄。' },
              { name: '先鋒攀登', description: '挑戰高一級的長路線，記錄完攀情況。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操檢討',
            description: '完整恢復並規劃下一週期。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展流程放鬆疲勞。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },

  // 野火（Wildfire）：力量與多樣化嘗試
  PFB: {
    typeCode: 'PFB',
    weeks: [
      {
        weekNumber: 1,
        theme: '多元力量啟動',
        days: [
          {
            dayNumber: 1,
            title: '多樣化力量',
            description: '以不同型態的力量動作建立基礎並保持新鮮感。',
            duration: 60,
            exercises: [
              {
                name: '抱石',
                description: '挑選風格各異的路線八條：包含壓掌、側拉、倒勾各種類型。',
              },
              { name: '核心訓練', description: '平板撐與懸吊抬腿各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '力量趣味挑戰',
            description: '透過遊戲化挑戰累積力量。',
            duration: 70,
            exercises: [
              {
                name: '抱石',
                description: '玩 add-on 接龍遊戲，與夥伴輪流加動作，自然累積力量負荷。',
              },
              { name: '指力板訓練', description: '七秒掛五組，嘗試不同握法增加變化。' },
              { name: '柔軟度訓練', description: '動態伸展暖身與收操。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復探索',
            description: '輕鬆恢復並嘗試新動作。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '髖與肩伸展，探索身體活動範圍。' },
              { name: '拮抗肌訓練', description: '伏地挺身與肩推平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '風格拓展',
        days: [
          {
            dayNumber: 1,
            title: '新風格力量',
            description: '挑戰平常較少嘗試的攀爬風格。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '專攻自己較弱的風格，如平衡板或大遠度，攀爬六條。' },
              { name: '校園板', description: '入門階梯上移三組，體驗爆發訓練。' },
            ],
          },
          {
            dayNumber: 2,
            title: '多樣抱石場次',
            description: '大量嘗試不同顏色路線維持動機。',
            duration: 80,
            exercises: [
              { name: '抱石', description: '挑戰整面新路線，盡量嘗試十條以上不重複風格。' },
              { name: '核心訓練', description: '前控與側棒各三組。' },
              { name: '柔軟度訓練', description: '針對今日使用較多的肌群伸展放鬆。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '輕鬆活動維持狀態。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展搭配呼吸放鬆。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋與手腕訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '高強度多樣化',
        days: [
          {
            dayNumber: 1,
            title: '強度挑戰',
            description: '在多樣化中加入高強度刺激。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '挑選接近極限的多種風格路線各兩條，全力嘗試。' },
              { name: '指力板訓練', description: '加重最大掛五組，嘗試不同握型。' },
            ],
          },
          {
            dayNumber: 2,
            title: '極限趣味專案',
            description: '投入有趣但具挑戰的專案路線。',
            duration: 85,
            exercises: [
              { name: '抱石', description: '選定兩條風格迥異的專案路線輪流嘗試，保持新鮮感。' },
              { name: '核心訓練', description: '懸體支撐與動態收腹各三組。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '高強度後的必要恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合與挑戰',
        days: [
          {
            dayNumber: 1,
            title: '全風格整合',
            description: '統合各種風格的力量表現。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '混合各種風格路線八條，驗證本月多樣化成果。' },
              { name: '核心訓練', description: '綜合核心循環兩輪。' },
            ],
          },
          {
            dayNumber: 2,
            title: '挑戰新高度',
            description: '在喜歡的風格上突破難度。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '在最擅長的風格挑戰高一級路線，記錄完攀。' },
              { name: '指力板訓練', description: '測試最大掛重，對照月初。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操檢討',
            description: '恢復並回顧最喜歡的訓練。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展放鬆。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },

  // 恆者（Anchor）：力量與穩定基礎
  PFS: {
    typeCode: 'PFS',
    weeks: [
      {
        weekNumber: 1,
        theme: '穩固基礎',
        days: [
          {
            dayNumber: 1,
            title: '基礎力量與穩定',
            description: '以一致的節奏建立可靠的力量基礎。',
            duration: 55,
            exercises: [
              { name: '指力板訓練', description: '十秒掛、五秒休，五組，選擇穩定能完成的握點。' },
              { name: '核心訓練', description: '平板撐與側棒各三組，建立軀幹穩定。' },
              { name: '拮抗肌訓練', description: '伏地挺身與划船各三組，維持肌群平衡。' },
            ],
          },
          {
            dayNumber: 2,
            title: '穩定攀爬',
            description: '以可控節奏完攀，建立信心與一致性。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '攀爬能穩定完成的路線八條，著重動作確實與腳法精準。' },
              { name: '核心訓練', description: '懸吊抬腿三組，維持攀爬張力。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與活動度',
            description: '維持關節健康與身體平衡。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '髖與肩伸展，每動作維持三十秒。' },
              { name: '拮抗肌訓練', description: '前臂伸肌訓練，預防失衡。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '穩定發展',
        days: [
          {
            dayNumber: 1,
            title: '力量鞏固',
            description: '在穩定基礎上小幅提升負荷。',
            duration: 60,
            exercises: [
              { name: '指力板訓練', description: '維持握點但延長至十二秒掛，五組。' },
              { name: '核心訓練', description: '前控與懸吊收腹各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '一致性攀爬',
            description: '反覆攀爬同類路線，建立穩定動作模式。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '重複完攀相同難度路線十條，追求每次動作一致。' },
              { name: '先鋒攀登', description: '完攀一條穩定難度路線，著重穩定掛繩。' },
              { name: '柔軟度訓練', description: '腿後與髖部伸展。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '促進恢復維持狀態穩定。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展搭配深呼吸。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '穩定強化',
        days: [
          {
            dayNumber: 1,
            title: '可控強度提升',
            description: '在可控範圍內提升力量強度。',
            duration: 65,
            exercises: [
              { name: '指力板訓練', description: '改用稍小握點，七秒掛五組，確保動作確實。' },
              { name: '核心訓練', description: '懸體支撐與側棒各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '穩定中突破',
            description: '在熟悉路線上嘗試小幅突破。',
            duration: 80,
            exercises: [
              { name: '抱石', description: '完攀熟悉難度後，嘗試兩條高半級的路線。' },
              { name: '先鋒攀登', description: '完攀兩條穩定路線，最後嘗試挑戰一條稍難。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '維持身體狀態。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合與穩固',
        days: [
          {
            dayNumber: 1,
            title: '整合穩定力量',
            description: '統合本月建立的穩定力量。',
            duration: 60,
            exercises: [
              { name: '抱石', description: '完攀本月各類路線八條，確認穩定度提升。' },
              { name: '核心訓練', description: '綜合核心循環兩輪。' },
            ],
          },
          {
            dayNumber: 2,
            title: '穩定測試',
            description: '評估力量與穩定的進步。',
            duration: 70,
            exercises: [
              { name: '指力板訓練', description: '測試最大掛時間，對照第一週。' },
              { name: '先鋒攀登', description: '穩定完攀高半級路線，記錄表現。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操檢討',
            description: '恢復並規劃下一週期。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展放鬆。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },

  // 狙擊手（Sniper）：技巧與精準目標
  TGB: {
    typeCode: 'TGB',
    weeks: [
      {
        weekNumber: 1,
        theme: '精準技巧基礎',
        days: [
          {
            dayNumber: 1,
            title: '腳法精準訓練',
            description: '建立精確踩點的基本功。',
            duration: 55,
            exercises: [
              { name: '抱石', description: '靜默攀爬，腳一旦踩出聲就重來，攀爬六條練習精準踩點。' },
              { name: '核心訓練', description: '平板撐與側棒各三組，支撐精準動作的身體控制。' },
            ],
          },
          {
            dayNumber: 2,
            title: '目標性動作',
            description: '針對特定技巧動作反覆練習。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '挑選含交叉手與精準抓點的路線，分解練習六條。' },
              { name: '柔軟度訓練', description: '髖部伸展提升高踩腳能力。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與活動度',
            description: '維持身體狀態。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展，每動作維持三十秒。' },
              { name: '拮抗肌訓練', description: '伏地挺身與肩推平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '專案聚焦',
        days: [
          {
            dayNumber: 1,
            title: '專案路線拆解',
            description: '選定目標路線，逐段拆解動作。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '選定一條專案路線，逐段拆解並反覆練習關鍵動作。' },
              { name: '核心訓練', description: '前控與懸吊抬腿各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '精準動作循環',
            description: '強化目標動作的執行精度。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '反覆練習專案中最難的兩個動作，直到穩定執行。' },
              { name: '指力板訓練', description: '針對專案所需握型做專項掛訓練，五組。' },
              { name: '柔軟度訓練', description: '針對專案所需動作做伸展。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '促進恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展搭配呼吸放鬆。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '高強度專案攻克',
        days: [
          {
            dayNumber: 1,
            title: '連段練習',
            description: '將拆解的動作串連成完整段落。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '將專案路線分上下半段，分別完整連段練習。' },
              { name: '核心訓練', description: '懸體支撐與旋轉控制各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '專案全力嘗試',
            description: '全力嘗試完攀目標路線。',
            duration: 85,
            exercises: [
              { name: '抱石', description: '充分暖身後全力嘗試專案路線，記錄每次卡關點。' },
              { name: '指力板訓練', description: '專項握型掛訓練五組，補強弱點。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '高強度後的恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '完攀與檢討',
        days: [
          {
            dayNumber: 1,
            title: '完攀衝刺',
            description: '集中嘗試完攀目標。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '在最佳狀態下嘗試完攀專案路線。' },
              { name: '核心訓練', description: '綜合核心循環兩輪。' },
            ],
          },
          {
            dayNumber: 2,
            title: '技巧驗證',
            description: '驗證本月技巧成長。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '挑選新的技巧型路線，驗證精準度是否提升。' },
              { name: '柔軟度訓練', description: '維持活動度的伸展流程。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操檢討',
            description: '恢復並回顧專案歷程。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展放鬆。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },

  // 解碼者（Cipher）：技巧與系統分析
  TGS: {
    typeCode: 'TGS',
    weeks: [
      {
        weekNumber: 1,
        theme: '動作分析基礎',
        days: [
          {
            dayNumber: 1,
            title: '基礎動作解析',
            description: '建立分析攀爬動作的能力。',
            duration: 55,
            exercises: [
              { name: '抱石', description: '攀爬前先觀察並口述路線解法，再依計畫攀爬六條。' },
              { name: '核心訓練', description: '平板撐與側棒各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '路線閱讀',
            description: '訓練上攀前的路線解讀能力。',
            duration: 70,
            exercises: [
              {
                name: '先鋒攀登',
                description: '攀爬前完整 onsight 解讀路線，預判每個動作再嘗試。',
              },
              { name: '柔軟度訓練', description: '髖與肩伸展提升動作選項。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與活動度',
            description: '維持身體狀態。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展，每動作維持三十秒。' },
              { name: '拮抗肌訓練', description: '伏地挺身與肩推平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '系統化練習',
        days: [
          {
            dayNumber: 1,
            title: '動作庫建立',
            description: '系統化練習各類基本動作。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '逐一練習側拉、倒勾、壓掌、掛腳四類動作各兩條。' },
              { name: '核心訓練', description: '前控與懸吊抬腿各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '解法比較',
            description: '同一路線嘗試多種解法並分析優劣。',
            duration: 75,
            exercises: [
              { name: '抱石', description: '同條路線嘗試至少兩種不同解法，記錄哪種更省力。' },
              { name: '先鋒攀登', description: '完攀後檢討解讀與實際攀爬的落差。' },
              { name: '柔軟度訓練', description: '針對今日動作伸展放鬆。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '促進恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展搭配呼吸放鬆。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '系統化精進',
        days: [
          {
            dayNumber: 1,
            title: '弱點系統補強',
            description: '針對分析出的弱點動作系統訓練。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '專攻自我分析出最弱的一類動作，反覆練習八條。' },
              { name: '核心訓練', description: '懸體支撐與旋轉控制各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '複雜路線解析',
            description: '挑戰需要縝密規劃的複雜路線。',
            duration: 85,
            exercises: [
              { name: '先鋒攀登', description: '挑戰需要休息點規劃與動作序列的長路線，逐段分析。' },
              { name: '指力板訓練', description: '針對弱點握型的專項掛訓練五組。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '高強度後的恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合與驗證',
        days: [
          {
            dayNumber: 1,
            title: '系統整合',
            description: '整合分析能力與動作執行。',
            duration: 65,
            exercises: [
              { name: '抱石', description: 'onsight 嘗試新路線，先分析再攀爬，驗證解讀準確度。' },
              { name: '核心訓練', description: '綜合核心循環兩輪。' },
            ],
          },
          {
            dayNumber: 2,
            title: '能力驗證',
            description: '驗證系統化訓練成果。',
            duration: 75,
            exercises: [
              { name: '先鋒攀登', description: '挑戰高一級路線，完整運用本月分析方法。' },
              { name: '柔軟度訓練', description: '維持活動度的伸展流程。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操檢討',
            description: '恢復並系統回顧訓練數據。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展放鬆。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },

  // 浪人（Wanderer）：技巧與探索多元路線
  TFB: {
    typeCode: 'TFB',
    weeks: [
      {
        weekNumber: 1,
        theme: '多元技巧探索',
        days: [
          {
            dayNumber: 1,
            title: '多樣動作體驗',
            description: '廣泛體驗不同類型的攀爬技巧。',
            duration: 55,
            exercises: [
              { name: '抱石', description: '刻意挑選風格各異的路線八條，體驗不同技巧需求。' },
              { name: '核心訓練', description: '平板撐與側棒各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '戶外技巧入門',
            description: '練習室外攀爬所需的適應能力。',
            duration: 70,
            exercises: [
              { name: '先鋒攀登', description: '練習在不同角度岩壁上閱讀自然點，完攀三條。' },
              { name: '柔軟度訓練', description: '全身伸展提升動作適應範圍。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與活動度',
            description: '維持身體狀態。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展，每動作維持三十秒。' },
              { name: '拮抗肌訓練', description: '伏地挺身與肩推平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '適應力拓展',
        days: [
          {
            dayNumber: 1,
            title: '陌生風格挑戰',
            description: '挑戰平常較少接觸的攀爬型態。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '專攻自己最不熟悉的風格，如懸壁或平衡板，攀爬六條。' },
              { name: '核心訓練', description: '前控與懸吊抬腿各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '多元路線巡禮',
            description: '大量嘗試不同類型路線拓展適應力。',
            duration: 75,
            exercises: [
              { name: '先鋒攀登', description: '完攀不同角度與風格的路線四條，著重快速適應。' },
              { name: '抱石', description: '嘗試需要特殊技巧的路線六條，如煙囪或裂隙模擬。' },
              { name: '柔軟度訓練', description: '針對今日使用肌群伸展。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '促進恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展搭配呼吸放鬆。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '挑戰多元極限',
        days: [
          {
            dayNumber: 1,
            title: '多風格高強度',
            description: '在多種風格中加入強度挑戰。',
            duration: 70,
            exercises: [
              { name: '抱石', description: '挑選不同風格的接近極限路線各兩條全力嘗試。' },
              { name: '核心訓練', description: '懸體支撐與旋轉控制各三組。' },
            ],
          },
          {
            dayNumber: 2,
            title: '探索性專案',
            description: '投入有探索價值的多元專案。',
            duration: 85,
            exercises: [
              { name: '先鋒攀登', description: '挑戰一條需要綜合技巧的長路線，逐段適應。' },
              { name: '柔軟度訓練', description: '針對路線所需動作做伸展。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '高強度後的恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆搭配伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合與探索成果',
        days: [
          {
            dayNumber: 1,
            title: '全能整合',
            description: '統合各種風格的技巧能力。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '混合各風格路線八條，驗證適應力提升。' },
              { name: '核心訓練', description: '綜合核心循環兩輪。' },
            ],
          },
          {
            dayNumber: 2,
            title: '探索新領域',
            description: '挑戰全新型態的路線。',
            duration: 75,
            exercises: [
              { name: '先鋒攀登', description: '嘗試一條從未挑戰過類型的高難度路線。' },
              { name: '柔軟度訓練', description: '維持活動度的伸展流程。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操檢討',
            description: '恢復並回顧探索歷程。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '全身伸展放鬆。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },

  // 禪者（Zen）：技巧與身心平衡
  TFS: {
    typeCode: 'TFS',
    weeks: [
      {
        weekNumber: 1,
        theme: '覺察基礎',
        days: [
          {
            dayNumber: 1,
            title: '呼吸與動作覺察',
            description: '建立攀爬時的呼吸與身體覺察。',
            duration: 50,
            exercises: [
              {
                name: '抱石',
                description: '緩慢攀爬簡單路線六條，全程配合呼吸，覺察每個重心轉移。',
              },
              { name: '柔軟度訓練', description: '結合呼吸的伸展流程，每動作維持三十秒。' },
            ],
          },
          {
            dayNumber: 2,
            title: '流暢動作練習',
            description: '練習連貫不停頓的流暢攀爬。',
            duration: 65,
            exercises: [
              { name: '先鋒攀登', description: '完攀熟悉路線兩條，追求動作如流水般連貫不停滯。' },
              { name: '核心訓練', description: '平板撐與側棒各三組，培養穩定的身體控制。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復與放鬆',
            description: '身心放鬆的恢復日。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '緩慢深層伸展搭配冥想呼吸。' },
              { name: '拮抗肌訓練', description: '伏地挺身與肩推輕量平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 2,
        theme: '身心連結',
        days: [
          {
            dayNumber: 1,
            title: '專注動作',
            description: '在每個動作中保持全然專注。',
            duration: 60,
            exercises: [
              { name: '抱石', description: '攀爬中段難度路線六條，每個動作前先穩定呼吸再執行。' },
              { name: '核心訓練', description: '前控與懸吊抬腿各三組，配合呼吸節奏。' },
            ],
          },
          {
            dayNumber: 2,
            title: '心流練習',
            description: '在熟悉路線上追求心流狀態。',
            duration: 70,
            exercises: [
              {
                name: '先鋒攀登',
                description: '反覆完攀熟悉路線，直到能完全進入心流不被雜念干擾。',
              },
              { name: '抱石', description: '靜心攀爬六條，動作之間不急躁，享受過程。' },
              { name: '柔軟度訓練', description: '結合呼吸的伸展放鬆。' },
            ],
          },
          {
            dayNumber: 3,
            title: '主動恢復',
            description: '身心放鬆。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '緩慢伸展搭配深呼吸冥想。' },
              { name: '拮抗肌訓練', description: '輕量肩外旋訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 3,
        theme: '壓力中的平衡',
        days: [
          {
            dayNumber: 1,
            title: '壓力下的覺察',
            description: '在較高難度下維持冷靜與覺察。',
            duration: 65,
            exercises: [
              { name: '抱石', description: '挑戰接近極限的路線，刻意在掙扎時維持呼吸節奏。' },
              { name: '核心訓練', description: '懸體支撐與側棒各三組，培養壓力下的穩定。' },
            ],
          },
          {
            dayNumber: 2,
            title: '高難度心流',
            description: '在挑戰性路線上維持流暢與專注。',
            duration: 80,
            exercises: [
              { name: '先鋒攀登', description: '挑戰高一級路線，面對墜落恐懼時專注於呼吸與動作。' },
              { name: '柔軟度訓練', description: '針對路線所需動作做伸展。' },
            ],
          },
          {
            dayNumber: 3,
            title: '恢復日',
            description: '完整的身心恢復。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '泡棉滾筒放鬆搭配冥想伸展。' },
              { name: '拮抗肌訓練', description: '輕量推拉平衡訓練。' },
            ],
          },
        ],
      },
      {
        weekNumber: 4,
        theme: '整合身心',
        days: [
          {
            dayNumber: 1,
            title: '身心整合',
            description: '統合技巧、呼吸與專注。',
            duration: 60,
            exercises: [
              { name: '抱石', description: '完攀各難度路線八條，全程保持呼吸與動作的和諧。' },
              { name: '核心訓練', description: '綜合核心循環兩輪，配合呼吸。' },
            ],
          },
          {
            dayNumber: 2,
            title: '心流驗證',
            description: '在挑戰中驗證身心平衡成果。',
            duration: 70,
            exercises: [
              { name: '先鋒攀登', description: '挑戰高難度路線，全程維持心流與冷靜。' },
              { name: '柔軟度訓練', description: '維持活動度的緩慢伸展。' },
            ],
          },
          {
            dayNumber: 3,
            title: '收操與沉澱',
            description: '身心沉澱並回顧歷程。',
            duration: 45,
            exercises: [
              { name: '柔軟度訓練', description: '深層伸展搭配冥想放鬆。' },
              { name: '拮抗肌訓練', description: '輕量拮抗訓練收尾。' },
            ],
          },
        ],
      },
    ],
  },
}

/**
 * 取得指定人格類型的訓練計畫
 */
export function getTrainingPlan(code: PersonalityTypeCode): TrainingPlan {
  return TRAINING_PLANS[code]
}
