#!/usr/bin/env node

/**
 * 補完人生清單腳本
 *
 * 用途：為指定使用者帳號填入完整的人生清單項目，用於測試
 *
 * 使用方式：
 *   1. 基本使用（會提示輸入密碼）:
 *      node scripts/populate-bucket-list.js vincentxu@gmail.com
 *
 *   2. 直接指定密碼:
 *      node scripts/populate-bucket-list.js vincentxu@gmail.com your_password
 *
 *   3. 使用環境變數:
 *      EMAIL=vincentxu@gmail.com PASSWORD=your_password node scripts/populate-bucket-list.js
 */

const https = require('https');
const readline = require('readline');

const API_BASE = process.env.API_BASE || 'https://api.nobodyclimb.cc/api/v1';

// 從命令列參數或環境變數取得帳號密碼
const args = process.argv.slice(2);
const EMAIL = args[0] || process.env.EMAIL;
const PASSWORD = args[1] || process.env.PASSWORD;

/**
 * 人生清單項目資料
 * 包含各種類型的目標：戶外路線、室內難度、比賽、訓練、冒險、技能等
 */
const BUCKET_LIST_ITEMS = [
  // 已完成的目標
  {
    title: '完攀龍洞「海洋之心」5.11a',
    category: 'outdoor_route',
    description: '這是龍洞的經典路線之一，擁有美麗的橫渡段落和技術性動作。25 米的路線長度需要良好的耐力和技巧。',
    target_grade: '5.11a',
    target_location: '龍洞',
    status: 'completed',
    enable_progress: false,
    is_public: true,
    completion_data: {
      completion_story: '經過三個月的準備和多次嘗試，終於在 2023 年 5 月完成了這條夢寐以求的路線。那天天氣很好，海風徐徐，岩壁上灑滿陽光。\n\n第一次嘗試時，我在中段的橫渡處掉了下來，手點太小、腳點又滑。後來教練提醒我要用腳推而不是用手拉，重心要貼近岩壁。第二次嘗試時，我專注在腳法上，終於順利通過了橫渡段。\n\n當我扣上最後一個快扣時，整個身體都在發抖，不是因為害怕，而是因為興奮和感動。站在頂端看著遠方的海景，那一刻覺得所有的努力都值得了。',
      psychological_insights: '這次完攀讓我深刻體會到「堅持」的力量。每次失敗後爬起來再試，每次分析錯誤、調整策略，這個過程本身就是最大的收穫。我學會了不要被一時的失敗打倒，而是要保持耐心、相信自己終究能做到。\n\n另外，我也更理解了「享受過程」的意義。如果只是為了完攀而攀爬，會失去很多樂趣。當我放慢速度、專注在每個動作的細節時，反而更容易成功。',
      technical_insights: '技術方面，這條路線教會我幾個重要觀念：\n\n1. **腳法是關鍵**：橫渡段需要精準的腳點配置，每一步都要踩穩踩實。\n2. **重心貼牆**：手點很小時，要讓重心更靠近岩壁，增加摩擦力。\n3. **呼吸節奏**：長路線需要控制呼吸，在休息點深呼吸、調整心跳。\n4. **路線閱讀**：事前觀察整條路線，規劃每個休息點和關鍵動作。',
      completion_media: {
        youtube_videos: [],
        instagram_posts: [],
        photos: [],
      },
    },
  },
  {
    title: '完成第一次 V4 抱石路線',
    category: 'indoor_grade',
    description: '在 Original 岩館的 45 度板上，一條需要動態動作和精準接點的 V4 路線。',
    target_grade: 'V4',
    target_location: 'Original 岩館',
    status: 'completed',
    enable_progress: false,
    is_public: true,
    completion_data: {
      completion_story: '這是我攀岩生涯中重要的里程碑。從開始接觸抱石到完攀 V4，整整花了一年半的時間。\n\n這條路線在岩館的 45 度板上，起攀就很難，需要從坐姿起來。中段有一個動態動作，要從一個小點跳到另一個遠處的點。我試了兩個月，每週都去挑戰，一直失敗。\n\n最困難的是那個動態動作，每次都差一點點就接到了。教練建議我練習爆發力和接點的準確度。我開始做校園板訓練，也練習在其他路線上做動態動作。\n\n某個週五晚上，岩館人不多，我決定再試一次。這次我深呼吸、專注在動作上，起攀很順利，到了關鍵的動態動作時，我用力一跳——接到了！整個岩館的朋友都為我歡呼。那種感覺至今難忘。',
      psychological_insights: '完成這條路線讓我明白，進步不是線性的。有時候會停滯很久，但只要持續練習，某一天就會突然突破。重要的是不要放棄，要相信過程。\n\n另外，我也學會了「享受挑戰」。與其焦慮為什麼還沒完成，不如享受每次嘗試的過程，每次都比上次更了解這條路線一點。',
      technical_insights: '這條路線的技術重點：\n\n1. **起攀姿勢**：坐姿起攀需要核心力量和平衡感\n2. **動態動作**：需要爆發力、時機掌握和接點準確度\n3. **手指力量**：很多小點需要強大的手指力量\n4. **身體張力**：在板上需要保持全身張力，不然會盪開',
      completion_media: {
        youtube_videos: [],
        instagram_posts: [],
        photos: [],
      },
    },
  },

  // 進行中的目標（帶進度條）
  {
    title: '完攀 10 條 5.11 等級的路線',
    category: 'outdoor_route',
    description: '挑戰自己在 5.11 這個難度等級的穩定性和全面性，目標是在龍洞和墾丁完成 10 條不同風格的 5.11 路線。',
    target_grade: '5.11a-5.11d',
    target_location: '龍洞、墾丁',
    status: 'active',
    enable_progress: true,
    progress_mode: 'milestone',
    progress: 60,
    milestones: [
      {
        id: '1',
        title: '完攀 3 條 5.11a',
        percentage: 30,
        completed: true,
        completed_at: '2024-05-15',
        note: '在龍洞完成了「海洋之心」、「藍色珊瑚」和「晨曦」三條經典 5.11a',
      },
      {
        id: '2',
        title: '完攀 2 條 5.11b',
        percentage: 50,
        completed: true,
        completed_at: '2024-08-20',
        note: '墾丁的「熱帶風暴」和龍洞的「石中劍」',
      },
      {
        id: '3',
        title: '完攀 2 條 5.11c',
        percentage: 70,
        completed: false,
        completed_at: null,
        note: '目前正在嘗試龍洞的「天堂階梯」',
      },
      {
        id: '4',
        title: '完攀 3 條 5.11d',
        percentage: 100,
        completed: false,
        completed_at: null,
        note: '這是最終目標，預計明年達成',
      },
    ],
    is_public: true,
  },
  {
    title: '達成先鋒墜落 50 次',
    category: 'training',
    description: '克服先鋒墜落恐懼的訓練計畫。透過有計劃的練習墜落，建立對確保系統的信任和克服高度恐懼。',
    target_grade: null,
    target_location: 'Original 岩館',
    status: 'active',
    enable_progress: true,
    progress_mode: 'manual',
    progress: 74,
    milestones: null,
    is_public: true,
  },

  // 進行中的挑戰目標
  {
    title: '完攀墾丁「自由之路」5.12a',
    category: 'outdoor_route',
    description: '墾丁最經典的 5.12a 路線，擁有連續的 crimps 和需要爆發力的動作。30 米的長度對耐力也是極大考驗。',
    target_grade: '5.12a',
    target_location: '墾丁',
    target_date: '2025-12-31',
    status: 'active',
    enable_progress: true,
    progress_mode: 'milestone',
    progress: 40,
    milestones: [
      {
        id: '1',
        title: '完成路線觀察和動作分析',
        percentage: 20,
        completed: true,
        completed_at: '2024-10-15',
        note: '已經研究過整條路線，記下每個難點和休息點',
      },
      {
        id: '2',
        title: '完攀前半段（到第 4 個 bolt）',
        percentage: 40,
        completed: true,
        completed_at: '2024-12-05',
        note: '前半段技術性動作已經掌握，可以穩定通過',
      },
      {
        id: '3',
        title: '通過 crux（中段連續 crimps）',
        percentage: 70,
        completed: false,
        completed_at: null,
        note: '這是最難的部分，需要更強的手指力量',
      },
      {
        id: '4',
        title: '完攀整條路線',
        percentage: 100,
        completed: false,
        completed_at: null,
        note: '最終目標！',
      },
    ],
    is_public: true,
  },
  {
    title: '挑戰 V6 抱石路線',
    category: 'indoor_grade',
    description: '進入 V6 等級是我抱石的下一個目標。需要在力量、技巧和心理素質上都有所提升。',
    target_grade: 'V6',
    target_location: 'Original 岩館',
    target_date: '2025-06-30',
    status: 'active',
    enable_progress: true,
    progress_mode: 'manual',
    progress: 25,
    milestones: null,
    is_public: true,
  },
  {
    title: '參加台灣抱石公開賽',
    category: 'competition',
    description: '挑戰自己參加正式比賽，體驗競技攀岩的氛圍和壓力。目標不是名次，而是享受過程並測試自己在壓力下的表現。',
    target_grade: null,
    target_location: '台灣',
    target_date: '2025-09-30',
    status: 'active',
    enable_progress: false,
    is_public: true,
  },

  // 技能類目標
  {
    title: '學會 Campus Board 訓練',
    category: 'skill',
    description: '掌握校園板（Campus Board）訓練技巧，提升爆發力和指力。這是進階攀岩者必備的訓練方法。',
    target_grade: null,
    target_location: 'Original 岩館',
    status: 'active',
    enable_progress: true,
    progress_mode: 'milestone',
    progress: 50,
    milestones: [
      {
        id: '1',
        title: '學習正確姿勢和安全注意事項',
        percentage: 20,
        completed: true,
        completed_at: '2024-11-01',
        note: '已經了解基本原則和常見錯誤',
      },
      {
        id: '2',
        title: '能完成基礎 ladders 訓練',
        percentage: 50,
        completed: true,
        completed_at: '2024-12-15',
        note: '可以穩定完成 1-3-5 的 ladder',
      },
      {
        id: '3',
        title: '掌握 bumps 和 touches',
        percentage: 70,
        completed: false,
        completed_at: null,
        note: '目前還在練習中',
      },
      {
        id: '4',
        title: '能完成 double dynos',
        percentage: 100,
        completed: false,
        completed_at: null,
        note: '這是最難的動作',
      },
    ],
    is_public: true,
  },
  {
    title: '學習裂隙攀登（Crack Climbing）',
    category: 'skill',
    description: '學習傳統攀登中的裂隙技巧，包括 hand jam、foot jam 等技術。這是戶外攀登的重要技能。',
    target_grade: null,
    target_location: '龍洞、美國優勝美地',
    target_date: '2026-06-30',
    status: 'active',
    enable_progress: true,
    progress_mode: 'manual',
    progress: 10,
    milestones: null,
    is_public: true,
  },

  // 冒險類目標
  {
    title: '泰國 Krabi 攀岩旅行',
    category: 'adventure',
    description: '前往泰國喀比（Krabi）進行為期 10 天的攀岩旅行，體驗世界級的石灰岩攀岩場。',
    target_grade: null,
    target_location: '泰國 Krabi',
    status: 'completed',
    enable_progress: false,
    is_public: true,
    completion_data: {
      completion_story: '2024 年 3 月，我和四個岩友一起飛往泰國喀比，展開了我的第一次國際攀岩旅行。Krabi 的石灰岩攀岩場美得令人屏息，許多路線就在海邊的懸崖上，可以邊攀岩邊欣賞安達曼海的美景。\n\n我們住在 Railay Beach 附近，每天早上 7 點起床攀岩，避開中午的酷熱。那裡的路線非常多樣，從簡單的 5.8 到困難的 5.13 都有。石灰岩的質地和台灣的岩壁很不同，點位更尖銳、更需要精準的腳法。\n\n最難忘的是攀爬 Tonsai Tower 的經典路線「Pocket Rocket」。這是一條 25 米的 5.11b，有很多需要手指力量的 pocket 點位。第一次嘗試時，我的手指很快就沒力了。休息一天後再試，終於完攀了！\n\n除了攀岩，我們也在海灘游泳、做 deep water solo、在沙灘餐廳享用泰式料理。那 10 天是我最快樂的時光之一，不只提升了攀岩技術，也體驗了不同的攀岩文化，更重要的是和岩友們建立了深厚的友誼。',
      psychological_insights: '這次旅行讓我體會到「走出舒適圈」的重要性。在陌生的環境、不同的岩質上攀爬，一開始很不適應，但正是這種挑戰讓我成長。我學會了快速適應、保持開放心態、從失敗中學習。\n\n另外，這次旅行也讓我更深刻地感受到攀岩社群的溫暖。在 Krabi 認識了來自世界各地的攀岩者，大家語言不同、背景不同，但都因為攀岩而連結在一起。那種跨越國界的友誼很珍貴。',
      technical_insights: '石灰岩攀登的技術心得：\n\n1. **Pocket 點位的使用**：手指要插進去、用第二指節鎖住，不能只用指尖\n2. **尖銳點位的抓法**：需要更精準的接點，不能滑動\n3. **鞋子的選擇**：石灰岩的摩擦力好，可以用稍微鬆一點的鞋子增加舒適度\n4. **路線閱讀**：石灰岩路線通常很長，需要規劃好休息點和節奏',
      completion_media: {
        youtube_videos: [],
        instagram_posts: [],
        photos: [],
      },
    },
  },
  {
    title: '法國 Fontainebleau 抱石朝聖',
    category: 'adventure',
    description: '前往抱石聖地 Fontainebleau，攀爬那些傳奇的經典抱石路線，感受抱石運動的歷史和文化。',
    target_grade: null,
    target_location: '法國 Fontainebleau',
    target_date: '2026-09-30',
    status: 'active',
    enable_progress: false,
    is_public: true,
  },
  {
    title: '攀登台灣百岳並結合攀岩',
    category: 'adventure',
    description: '結合登山和攀岩，挑戰在高山環境中進行攀岩活動。目標是攀登 3 座百岳並在附近進行攀岩探索。',
    target_grade: null,
    target_location: '台灣高山',
    target_date: '2027-12-31',
    status: 'active',
    enable_progress: true,
    progress_mode: 'milestone',
    progress: 0,
    milestones: [
      {
        id: '1',
        title: '完成高山適應訓練',
        percentage: 25,
        completed: false,
        completed_at: null,
        note: '需要先適應高海拔環境',
      },
      {
        id: '2',
        title: '攀登第一座百岳並攀岩',
        percentage: 50,
        completed: false,
        completed_at: null,
        note: '計畫從奇萊山開始',
      },
      {
        id: '3',
        title: '攀登第二座百岳並攀岩',
        percentage: 75,
        completed: false,
        completed_at: null,
        note: null,
      },
      {
        id: '4',
        title: '攀登第三座百岳並攀岩',
        percentage: 100,
        completed: false,
        completed_at: null,
        note: null,
      },
    ],
    is_public: true,
  },

  // 訓練類目標
  {
    title: '連續 100 天攀岩訓練',
    category: 'training',
    description: '挑戰自己連續 100 天進行攀岩相關訓練（包括攀爬、肌力訓練、柔軟度訓練等），培養穩定的訓練習慣。',
    target_grade: null,
    target_location: null,
    target_date: '2025-05-31',
    status: 'active',
    enable_progress: true,
    progress_mode: 'manual',
    progress: 45,
    milestones: null,
    is_public: true,
  },
  {
    title: '單次攀爬 1000 米',
    category: 'training',
    description: '在一次訓練中累積攀爬 1000 米的垂直高度，測試自己的耐力極限。',
    target_grade: null,
    target_location: 'Original 岩館',
    status: 'active',
    enable_progress: false,
    is_public: true,
  },

  // 受傷恢復類
  {
    title: '手指 A2 滑車傷勢完全康復',
    category: 'injury_recovery',
    description: '2024 年因過度訓練造成右手中指 A2 滑車受傷，目標是完全康復並能回到之前的訓練強度。',
    target_grade: null,
    target_location: null,
    status: 'completed',
    enable_progress: false,
    is_public: true,
    completion_data: {
      completion_story: '2024 年初，我太急著突破瓶頸，訓練強度過高，導致右手中指 A2 滑車受傷。一開始只是覺得手指有點痛，但我沒有重視，繼續訓練。結果越來越嚴重，最後痛到無法攀爬。\n\n去看醫生後，被診斷為 A2 滑車拉傷，需要休息 3 個月。那段時間真的很煎熬，看著朋友們繼續進步，自己卻只能在旁邊看。我甚至懷疑自己是否能再回到之前的狀態。\n\n但這次受傷也是一個轉機。我開始重新學習如何正確訓練、如何預防運動傷害。我做了很多手指復健運動、按摩、物理治療。我也開始更注重熱身、收操和休息。\n\n經過 4 個月的復健（比預期多一個月），我的手指終於完全康復了。現在我可以正常攀爬，甚至比受傷前更強。因為我學會了更聰明的訓練方式，也更懂得聆聽身體的聲音。',
      psychological_insights: '這次受傷是我攀岩路上的重要一課。我學會了：\n\n1. **預防勝於治療**：不要等到受傷才重視身體警訊\n2. **休息也是訓練**：適當的休息能讓身體更強壯\n3. **耐心的重要性**：復健需要時間，急不得\n4. **正面態度**：受傷雖然痛苦，但也是重新檢視和調整的機會\n\n現在我對於攀岩有了更健康的態度，不再只追求難度和進步，而是更重視長期的可持續性。',
      technical_insights: '預防手指受傷的方法：\n\n1. **充分熱身**：至少 15 分鐘，包括手指、手腕、手臂的活動\n2. **漸進式訓練**：不要突然增加訓練強度或難度\n3. **避免 full crimp**：盡量使用 half crimp 或 open hand\n4. **拮抗肌訓練**：訓練伸指肌，平衡屈指肌的力量\n5. **適當休息**：感覺手指不適就要休息，不要硬撐\n6. **按摩和伸展**：訓練後做手指按摩和伸展',
      completion_media: {
        youtube_videos: [],
        instagram_posts: [],
        photos: [],
      },
    },
  },

  // 其他類別
  {
    title: '教會 5 個新手朋友攀岩',
    category: 'other',
    description: '分享攀岩的樂趣，帶領新手朋友入門。希望透過我的引導，讓更多人愛上攀岩。',
    target_grade: null,
    target_location: 'Original 岩館',
    status: 'active',
    enable_progress: true,
    progress_mode: 'manual',
    progress: 60,
    milestones: null,
    is_public: true,
  },
  {
    title: '拍攝一支攀岩紀錄短片',
    category: 'other',
    description: '用影片記錄自己的攀岩旅程，分享給更多人。內容包括訓練過程、戶外攀岩、心路歷程等。',
    target_grade: null,
    target_location: null,
    target_date: '2025-12-31',
    status: 'active',
    enable_progress: true,
    progress_mode: 'manual',
    progress: 15,
    milestones: null,
    is_public: true,
  },
];

/**
 * HTTP 請求封裝
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (e) {
          reject(new Error(`Failed to parse JSON response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 登入取得 access token
 */
async function login(email, password) {
  console.log(`\n正在登入: ${email}...`);

  const response = await makeRequest(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: { email, password },
  });

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`登入失敗: ${JSON.stringify(response.data)}`);
  }

  console.log('✓ 登入成功');
  return response.data.data.access_token;
}

/**
 * 取得使用者的 biography
 */
async function getBiography(accessToken) {
  const response = await makeRequest(`${API_BASE}/biographies/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`取得人物誌失敗: ${JSON.stringify(response.data)}`);
  }

  return response.data.data;
}

/**
 * 取得使用者的人生清單
 */
async function getBucketList(accessToken, biographyId) {
  console.log('\n正在取得現有人生清單...');

  const response = await makeRequest(`${API_BASE}/bucket-list/${biographyId}?limit=100`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`取得人生清單失敗: ${JSON.stringify(response.data)}`);
  }

  console.log(`✓ 已取得現有人生清單 (${response.data.data.length} 個項目)`);
  return response.data.data;
}

/**
 * 建立人生清單項目
 */
async function createBucketListItem(accessToken, item) {
  const response = await makeRequest(`${API_BASE}/bucket-list`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: {
      title: item.title,
      category: item.category,
      description: item.description,
      target_grade: item.target_grade,
      target_location: item.target_location,
      target_date: item.target_date,
      status: item.status,
      enable_progress: item.enable_progress,
      progress_mode: item.progress_mode,
      progress: item.progress,
      milestones: item.milestones,
      is_public: item.is_public,
    },
  });

  if (response.status !== 201 || !response.data.success) {
    throw new Error(`建立項目失敗: ${JSON.stringify(response.data)}`);
  }

  return response.data.data;
}

/**
 * 完成人生清單項目
 */
async function completeItem(accessToken, itemId, completionData) {
  const response = await makeRequest(`${API_BASE}/bucket-list/${itemId}/complete`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: completionData,
  });

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`完成項目失敗: ${JSON.stringify(response.data)}`);
  }

  return response.data.data;
}

/**
 * 從命令列讀取密碼
 */
function readPassword() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.stdoutMuted = true;
    rl.question('請輸入密碼: ', (password) => {
      rl.close();
      console.log('');
      resolve(password);
    });

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted) {
        rl.output.write('*');
      } else {
        rl.output.write(stringToWrite);
      }
    };
  });
}

/**
 * 統計分類
 */
function getCategoryStats(items) {
  const stats = {};
  items.forEach(item => {
    const category = item.category || 'other';
    if (!stats[category]) {
      stats[category] = { total: 0, completed: 0, active: 0 };
    }
    stats[category].total++;
    if (item.status === 'completed') {
      stats[category].completed++;
    } else if (item.status === 'active') {
      stats[category].active++;
    }
  });
  return stats;
}

/**
 * 主程式
 */
async function main() {
  console.log('='.repeat(60));
  console.log('人生清單補完腳本');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);

  // 檢查必要參數
  if (!EMAIL) {
    console.error('\n錯誤: 請提供 email');
    console.error('\n使用方式:');
    console.error('  node scripts/populate-bucket-list.js <email> [password]');
    console.error('  或');
    console.error('  EMAIL=<email> PASSWORD=<password> node scripts/populate-bucket-list.js');
    process.exit(1);
  }

  let password = PASSWORD;
  if (!password) {
    password = await readPassword();
  }

  try {
    // 1. 登入取得 token
    const accessToken = await login(EMAIL, password);

    // 2. 取得使用者的 biography
    console.log('\n正在取得使用者人物誌...');
    const biography = await getBiography(accessToken);
    if (!biography) {
      throw new Error('請先建立人物誌！可以先執行 populate-biography.js');
    }
    console.log(`✓ 已取得人物誌 (ID: ${biography.id})`);

    // 3. 取得現有人生清單
    const existingItems = await getBucketList(accessToken, biography.id);
    const beforeStats = getCategoryStats(existingItems);

    // 4. 建立人生清單項目
    console.log(`\n正在建立 ${BUCKET_LIST_ITEMS.length} 個人生清單項目...`);
    let createdCount = 0;
    let completedCount = 0;

    for (const item of BUCKET_LIST_ITEMS) {
      try {
        console.log(`\n  正在建立: ${item.title}`);
        const createdItem = await createBucketListItem(accessToken, item);
        console.log(`  ✓ 已建立 (ID: ${createdItem.id})`);
        createdCount++;

        // 如果有完成資料，則標記為完成
        if (item.completion_data) {
          console.log(`  正在標記為完成...`);
          await completeItem(accessToken, createdItem.id, item.completion_data);
          console.log(`  ✓ 已標記為完成`);
          completedCount++;
        }

        // 避免請求太快
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ✗ 失敗: ${error.message}`);
      }
    }

    // 5. 取得更新後的清單並顯示統計
    const updatedItems = await getBucketList(accessToken, biography.id);
    const afterStats = getCategoryStats(updatedItems);

    console.log('\n' + '='.repeat(60));
    console.log('人生清單統計');
    console.log('='.repeat(60));
    console.log(`總項目數: ${existingItems.length} → ${updatedItems.length}`);
    console.log(`新增項目: ${createdCount}`);
    console.log(`已完成項目（含完成故事）: ${completedCount}`);
    console.log('\n分類統計:');

    const categoryNames = {
      outdoor_route: '戶外路線',
      indoor_grade: '室內難度',
      competition: '比賽',
      training: '訓練',
      adventure: '冒險',
      skill: '技能',
      injury_recovery: '傷後復原',
      other: '其他',
    };

    Object.keys(afterStats).forEach(category => {
      const stat = afterStats[category];
      console.log(`  ${categoryNames[category] || category}: ${stat.total} 項 (完成 ${stat.completed}, 進行中 ${stat.active})`);
    });

    console.log('='.repeat(60));
    console.log('\n✓ 人生清單補完完成!');
    console.log(`\n可以前往以下網址查看:`);
    console.log(`https://nobodyclimb.cc/bucket-list`);

  } catch (error) {
    console.error('\n✗ 錯誤:', error.message);
    process.exit(1);
  }
}

// 執行主程式
if (require.main === module) {
  main().catch((error) => {
    console.error('\n未預期的錯誤:', error);
    process.exit(1);
  });
}

module.exports = { makeRequest, login, getBiography, getBucketList, createBucketListItem, completeItem };
