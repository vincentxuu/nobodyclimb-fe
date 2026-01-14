#!/usr/bin/env node

/**
 * 補完人物誌內容腳本
 *
 * 用途：為指定使用者帳號填入完整的人物誌資料，用於測試
 *
 * 使用方式：
 *   1. 基本使用（會提示輸入密碼）:
 *      node scripts/populate-biography.js vincentxu@gmail.com
 *
 *   2. 直接指定密碼:
 *      node scripts/populate-biography.js vincentxu@gmail.com your_password
 *
 *   3. 使用環境變數:
 *      EMAIL=vincentxu@gmail.com PASSWORD=your_password node scripts/populate-biography.js
 */

const https = require('https');
const readline = require('readline');

const API_BASE = process.env.API_BASE || 'https://api.nobodyclimb.cc/api/v1';

// 從命令列參數或環境變數取得帳號密碼
const args = process.argv.slice(2);
const EMAIL = args[0] || process.env.EMAIL;
const PASSWORD = args[1] || process.env.PASSWORD;

/**
 * 完整的人物誌測試資料
 * 包含所有 31 題進階故事問題的內容
 */
const BIOGRAPHY_DATA = {
  // 基本資料
  name: 'Vincent Xu',
  title: '資深攀岩愛好者',
  bio: '從 2018 年開始踏入攀岩世界，熱愛抱石與先鋒攀登。喜歡在岩壁上尋找身心的平衡，享受突破自我的每一個瞬間。',

  // Level 1: 基本攀岩資訊
  climbing_start_year: 2018,
  frequent_locations: '龍洞、墾丁、Original 岩館',
  favorite_route_type: '抱石、運動攀登',

  // Level 2: 核心故事 (3題)
  climbing_origin: '2018 年的某個週末，朋友邀我去岩館體驗攀岩。原本只是想試試看，沒想到第一次攀爬時，那種專注當下、忘記所有煩惱的感覺深深吸引了我。當完成第一條路線下來時，手臂雖然痠軟，心裡卻充滿了成就感。從那天起，我就愛上了這項運動，每週都會到岩館報到，開始了我的攀岩旅程。',

  climbing_meaning: '攀岩對我來說，是一種生活的調劑，也是自我探索的過程。在岩壁上，我學會了面對恐懼、接受失敗、享受當下。每次攀爬都是一次與自己對話的機會，讓我更了解自己的極限在哪裡，也更清楚自己想成為什麼樣的人。攀岩教會我，成功不是終點，過程中的每一次嘗試和學習才是最珍貴的。',

  advice_to_self: '如果能回到剛開始攀岩的那個時候，我會對自己說：「不要急，慢慢來。」剛開始時，我太在意自己能爬多難的路線，反而忽略了基本功的重要性。現在回頭看，那些看似簡單的基礎動作，才是進步的關鍵。還有，不要害怕失敗，每一次墜落都是學習的機會。享受過程，不要只看結果，攀岩才會真正帶給你快樂。',

  // Level 3A: 成長與突破 (6題)
  memorable_moment: '最難忘的是去年在龍洞完攀我的第一條 5.11a 路線。那是一條 25 米的路線，中段有一個很技術性的 crux，需要精準的腳點配置和重心轉移。前面試了三次都失敗，每次都在同一個地方掉下來。第四次攀登時，我深呼吸、放慢速度，仔細觀察每個點位，終於找到了關鍵的腳點。當我成功通過 crux、完成整條路線時，那種成就感至今難忘。',

  biggest_challenge: '我遇到最大的挑戰是 2020 年的手指受傷。當時為了突破瓶頸過度訓練，導致 A2 滑車受傷，整整休息了三個月不能攀岩。那段時間非常煎熬，看著朋友們繼續進步，自己卻只能在旁邊看。不過這次受傷讓我重新思考攀岩的意義，也學會了如何正確訓練、預防運動傷害。現在我會更注重熱身、肌力訓練和休息，攀岩變得更持久也更安全。',

  breakthrough_story: '最大的突破是克服對先鋒墜落的恐懼。剛開始先鋒攀登時，每次爬到 bolt 上方就會緊張，手腳都變僵硬。教練建議我練習故意墜落，從低處開始、慢慢增加高度。一開始真的很害怕，但經過多次練習後，我發現墜落其實沒那麼可怕。這個突破不只改善了我的攀爬表現，也讓我在生活中更敢於面對未知和挑戰。',

  first_outdoor: '第一次戶外攀岩是在龍洞，那是 2019 年春天的一個週末。看到真實的岩壁那麼高、那麼陡峭，心裡既興奮又緊張。第一條路線選了一條 5.9，雖然在岩館這個難度很輕鬆，但戶外的點位更自然、更不規則，需要更多的判斷和適應。當我站在岩壁頂端，看著遠方的海景，那種與大自然融為一體的感覺，是室內岩館無法比擬的。從那次之後，我就愛上了戶外攀岩。',

  first_grade: '第一次完攀 V4 抱石路線是在 2019 年底。那條路線在 Original 岩館的 45 度板上，crux 需要一個動態動作配合精準的接點。我試了整整兩個月，每週都去挑戰，一直失敗。直到某天，所有動作突然連起來了，我完成了整條路線。那一刻，整個岩館的朋友都為我歡呼。那種堅持後終於成功的感覺，讓我更確定攀岩就是我想要的生活方式。',

  frustrating_climb: '最挫折的經驗是去年在墾丁挑戰一條自己能力不足的路線。那條 5.11c 路線看起來很帥氣，我一時衝動就想嘗試。結果連第一個難關都過不去，墜落了無數次，最後不得不放棄。當下真的很沮喪，覺得自己很失敗。但教練跟我說：「知道自己的極限，也是一種成長。」這次經驗讓我學會更實際地評估自己的能力，也更懂得循序漸進的重要性。',

  // Level 3B: 心理與哲學 (6題)
  fear_management: '面對恐懼時，我會用「呼吸法」和「正向自我對話」來處理。每次感到害怕時，我會停下來深呼吸三次，讓心跳慢下來，然後對自己說：「我準備好了，我可以做到。」另外，我會把目標分解成小步驟，專注在下一個動作上，而不是想著整條路線有多難。這個方法不只在攀岩有用，在工作和生活上遇到壓力時，我也會用這個方式來克服焦慮。',

  climbing_lesson: '攀岩教會我最重要的一件事是「接受失敗」。在攀岩中，失敗是常態，墜落是學習的一部分。一開始我很難接受自己做不到，每次失敗都會很挫折。但慢慢地，我發現每次墜落都能學到新東西，每次失敗都讓我更接近成功。這個態度改變了我對人生的看法，讓我在工作和生活中也更能接受挫折，把它當作成長的機會。',

  failure_perspective: '攀岩完全改變了我看待失敗的方式。以前我認為失敗是丟臉的事，總是想要避免失敗。但在攀岩中，我發現最強的攀岩者也是墜落最多次的人。他們不怕失敗，反而從每次失敗中學習。現在我把失敗看作是「尚未成功」，而不是「做不到」。這個轉變讓我在面對挑戰時更有勇氣，也更願意嘗試新事物。',

  flow_moment: '有一次在龍洞攀爬一條長路線，當時陽光灑在岩壁上，海風輕輕吹過。我進入了完全專注的狀態，感覺身體自己在移動，每個動作都順暢自然，完全不需要思考。那種心流的感覺，時間好像靜止了，整個世界只剩下我和岩壁。爬完那條路線時，我才驚覺已經過了 20 分鐘，但感覺只有幾分鐘。那是我攀岩以來最美好的體驗之一。',

  life_balance: '在平衡工作、生活和攀岩上，我的方式是「固定排程」和「彈性調整」。我每週固定排三天攀岩時間，通常是週二、週四和週末。這樣既能維持訓練頻率，也不會影響工作。當工作特別忙時，我會減少到一週兩次，但絕不會完全停止。攀岩對我來說是充電而不是消耗，適當的運動反而讓我工作更有效率、生活更有品質。',

  unexpected_gain: '攀岩帶給我最意外的收穫是社交圈的擴大。原本我是個比較內向的人，不太會主動認識新朋友。但在岩館和戶外攀岩時，很自然就會跟其他攀岩者交流、互相確保。攀岩圈的朋友都很熱情友善，大家有共同話題、互相支持。現在我最好的朋友都是岩友，週末一起出去攀岩已經成為我最期待的時光。攀岩不只給了我運動，也給了我一個充滿正能量的社群。',

  // Level 3C: 社群與連結 (6題)
  climbing_mentor: '在我的攀岩路上，最感謝的是 Original 岩館的阿杰教練。他不只教我技術，更重要的是教我攀岩的態度和心法。每次我遇到瓶頸時，他總能一針見血地指出問題，同時給予鼓勵。記得有一次我因為受傷很沮喪，他跟我說：「攀岩是一輩子的事，不急這一時。」這句話讓我放下焦慮，學會享受過程。他不只是我的教練，更像是一位人生導師。',

  climbing_partner: '我最喜歡的繩伴是我的好友小明。我們是在岩館認識的，後來發現我們的攀岩風格和目標很類似，就自然成為搭檔。小明是個很細心的人，每次確保都很認真，讓我可以放心地挑戰難度。我們一起去過龍洞、墾丁、甚至飛去泰國攀岩旅行。最難忘的是有一次在龍洞，我卡在一個動作上很久，他在下面一直給我加油、幫我分析動作，最後我成功完攀了。有這樣的繩伴真的是很幸運的事。',

  funny_moment: '最尷尬的時刻是有一次在龍洞，我太專注在攀爬上，完全忘記自己的粉袋沒扣好。爬到一半想擦粉時，一伸手粉袋就掉下去了，還好沒砸到下面的人。更糗的是，我的繩伴要幫我撿粉袋時，還踩到海邊的水窪，整個鞋子都濕了。現在回想起來覺得很好笑，但當下真的很尷尬。從那之後，我每次攀爬前都會仔細檢查裝備！',

  favorite_spot: '我最推薦的攀岩地點是墾丁的攀岩場。那裡有各種難度的路線，適合不同程度的攀岩者。最棒的是可以邊攀岩邊看海景，尤其是傍晚時分，夕陽照在岩壁上特別美。而且墾丁氣候溫暖，冬天也很適合攀岩。附近有海灘可以玩水，晚上可以逛夜市，是一個結合運動和休閒的完美地點。強烈推薦大家找時間去體驗看看！',

  advice_to_group: '我想對女生攀岩者說：不要被刻板印象限制！我在岩館看過很多女生攀岩者，她們的技巧和柔軟度往往比男生還好。攀岩不只需要力量，更需要技巧、平衡和耐心，而這些正是女生的優勢。如果妳對攀岩有興趣，不要猶豫，勇敢嘗試看看。剛開始可能會覺得手沒力，但只要持續練習，進步的速度會讓妳自己驚訝。攀岩圈非常友善，大家都會互相幫忙和鼓勵的！',

  climbing_space: '對我來說最特別的攀岩空間是 Original 岩館。那是我開始攀岩的地方，承載了很多回憶。從第一次踏進岩館的緊張，到第一次完攀 V4 的興奮，到現在成為這裡的常客，每個階段的成長都在這裡發生。岩館的氛圍很溫暖，教練和岩友都像家人一樣。每次推開岩館的門，聞到那熟悉的粉味，就有一種回家的感覺。這裡不只是我攀岩的地方，更是我心靈的歸屬。',

  // Level 3D: 實用分享 (6題)
  injury_recovery: '2020 年我因為過度訓練造成手指 A2 滑車受傷，整整休息了三個月。復原過程很漫長，除了物理治療，我還做了很多手指復健運動。最重要的是，這次受傷讓我學會「聆聽身體的聲音」。現在我會更注重熱身、收操，訓練強度也會根據身體狀況調整。還有，我學會了「休息也是訓練的一部分」。受傷雖然痛苦，但它教會我如何更聰明、更長久地從事攀岩這項運動。',

  memorable_route: '最想分享的是龍洞的「海洋之心」路線，一條 5.11a 的運動攀登路線。這條路線有 25 米高，中段有一個很技術性的橫渡，需要精準的腳點和重心轉移。第一次爬的時候，我在橫渡處掉了好幾次，後來發現關鍵是要用腳推而不是用手拉。完成這條路線後，我的攀爬技巧提升了一個層次。推薦給想突破 5.10 進入 5.11 的朋友，這條路線會讓你重新認識腳法的重要性。',

  training_method: '我的訓練方式是「週間技術、週末實戰」。週二和週四在岩館做技巧訓練，專注在腳法、重心轉移和特定動作的練習。週末會去戶外攀岩或挑戰岩館的長路線，把技巧應用在實戰中。每週也會做一到兩次肌力訓練，包括核心、手指力量和拮抗肌群。最重要的是，每次訓練都會設定明確目標，而不是漫無目的地爬。這樣的訓練方式讓我持續進步，也不容易受傷。',

  effective_practice: '對我最有效的練習方法是「降級練習」。選擇比自己實力低 2-3 個等級的路線,專注在動作的完美度和效率上。例如我現在能爬 V5,就會用 V2-V3 的路線來練習腳法、重心轉移和流暢度。這個方法不只能改善技巧,還能建立肌肉記憶和攀爬自信。當技巧變好了,挑戰高難度路線時會更輕鬆。很多人忽略基礎訓練,反而限制了進步空間。',

  technique_tip: '一個對我很有幫助的技巧是「安靜的腳」。教練跟我說,好的攀岩者腳點時是安靜的,因為他們能精準控制重心和力道。我開始練習每次踩點都不發出聲音,強迫自己更專注、更精準。這個簡單的技巧改善了我的腳法,也讓我的攀爬變得更有效率。現在我會用「腳的聲音」來判斷自己的狀態,如果腳很吵,就知道自己太急躁了,需要慢下來。',

  gear_choice: '關於攀岩鞋,我的建議是不要一開始就買太緊的鞋。我第一雙鞋買太緊,雖然抓點力強,但穿 10 分鐘就痛到受不了,反而影響訓練。現在我有三雙鞋:一雙舒適的訓練鞋(用於長時間訓練)、一雙中等緊度的全能鞋(適合各種路線)、一雙很緊的競技鞋(只在嘗試難度路線時穿)。另外,粉袋的選擇也很重要,我偏好有小口袋可以放手機和鑰匙的款式,戶外攀岩時很實用。',

  // Level 3E: 夢想與探索 (5題)
  dream_climb: '我夢想中的攀登是去法國 Fontainebleau 朝聖。那裡是抱石攀登的聖地,有數千條經典路線,從簡單到極難都有。我特別想嘗試那些歷史悠久的經典路線,感受前人攀爬過的岩石。除了攀岩,Fontainebleau 的森林景觀也很美,可以在大自然中攀岩、露營,完全沉浸在攀岩的世界裡。希望在未來 2-3 年內能實現這個夢想,那會是我攀岩旅程中重要的里程碑。',

  climbing_trip: '最特別的攀岩旅行是 2022 年去泰國 Krabi 的那次。我和幾個岩友一起去,在那裡待了 10 天。Krabi 的石灰岩攀岩場非常壯觀,有些路線就在海邊的懸崖上,景色美到不行。我們每天早上攀岩,下午去海灘放鬆,晚上在沙灘餐廳聊天分享當天的經歷。那次旅行不只提升了我的攀岩技術,更重要的是體驗了不同的攀岩文化,也加深了和岩友們的友誼。',

  climbing_goal: '我目前最想達成的目標是完攀一條 5.12a 的運動攀登路線。這對我來說是一個很大的挑戰,需要在力量、技巧和心理素質上都有所提升。我已經設定了訓練計畫,預計在今年底前達成。為了這個目標,我增加了手指力量訓練,也開始練習更多的耐力路線。雖然過程辛苦,但每次看到自己一點一點進步,就覺得很值得。達成這個目標後,我會給自己一個獎勵,去國外攀岩旅行一趟。',

  climbing_style: '最吸引我的攀岩風格是「技術性面攀」。這種風格的路線通常不是很陡峭,但點位很小、很精準,需要細膩的腳法和平衡感。我喜歡那種需要仔細觀察、慢慢解題的感覺,每個動作都要精心設計,像是解謎一樣。相比力量型的路線,技術性路線更考驗攀岩者的智慧和經驗。當你找到那個完美的動作順序,整條路線突然變得流暢時,那種成就感是無可比擬的。',

  climbing_inspiration: '啟發我最深的是紀錄片《Free Solo》。Alex Honnold 徒手攀登 El Capitan 的勇氣和決心令人震撼,但更打動我的是他對攀岩純粹的熱愛和對完美的追求。他花了數年時間準備那次攀登,每個動作都練到完美。這讓我明白,真正的成就不是一蹴可幾的,而是來自長期的積累和準備。雖然我不會去嘗試 free solo,但他對攀岩的態度一直激勵著我,讓我更認真地對待每一次攀爬。',

  // Level 3F: 生活整合 (1題)
  life_outside_climbing: '除了攀岩,我也熱愛攝影,特別是戶外攝影。這兩個興趣其實很互補,每次去戶外攀岩時,我都會帶相機記錄沿途的風景和岩友們攀爬的瞬間。攝影讓我用不同的角度看世界,攀岩讓我有機會到達那些平常人去不了的地方。我還喜歡烹飪,週末會研究新食譜,做一些健康的餐點。我相信均衡的生活很重要,有不同的興趣可以讓生活更豐富,也能在不同的活動之間找到啟發和連結。',
};

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
 * 取得使用者的人物誌
 */
async function getBiography(accessToken) {
  console.log('\n正在取得現有人物誌資料...');

  const response = await makeRequest(`${API_BASE}/biographies/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    console.log('✓ 尚未建立人物誌');
    return null;
  }

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`取得人物誌失敗: ${JSON.stringify(response.data)}`);
  }

  console.log('✓ 已取得現有人物誌');
  return response.data.data;
}

/**
 * 建立人物誌
 */
async function createBiography(accessToken, data) {
  console.log('\n正在建立人物誌...');

  const response = await makeRequest(`${API_BASE}/biographies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });

  if (response.status !== 201 || !response.data.success) {
    throw new Error(`建立人物誌失敗: ${JSON.stringify(response.data)}`);
  }

  console.log('✓ 人物誌建立成功');
  return response.data.data;
}

/**
 * 更新人物誌
 */
async function updateBiography(accessToken, data) {
  console.log('\n正在更新人物誌資料...');

  const response = await makeRequest(`${API_BASE}/biographies/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`更新人物誌失敗: ${JSON.stringify(response.data)}`);
  }

  console.log('✓ 人物誌更新成功');
  return response.data.data;
}

/**
 * 計算故事完成度
 */
function calculateProgress(biography) {
  const storyFields = [
    // Level 2: Core stories
    'climbing_origin', 'climbing_meaning', 'advice_to_self',
    // Level 3A: Growth
    'memorable_moment', 'biggest_challenge', 'breakthrough_story',
    'first_outdoor', 'first_grade', 'frustrating_climb',
    // Level 3B: Psychology
    'fear_management', 'climbing_lesson', 'failure_perspective',
    'flow_moment', 'life_balance', 'unexpected_gain',
    // Level 3C: Community
    'climbing_mentor', 'climbing_partner', 'funny_moment',
    'favorite_spot', 'advice_to_group', 'climbing_space',
    // Level 3D: Practical
    'injury_recovery', 'memorable_route', 'training_method',
    'effective_practice', 'technique_tip', 'gear_choice',
    // Level 3E: Dreams
    'dream_climb', 'climbing_trip', 'bucket_list_story',
    'climbing_goal', 'climbing_style', 'climbing_inspiration',
    // Level 3F: Life
    'life_outside_climbing',
  ];

  const filled = storyFields.filter(field => {
    const value = biography[field];
    return value && typeof value === 'string' && value.trim().length > 0;
  });

  return {
    total: storyFields.length,
    filled: filled.length,
    percentage: Math.round((filled.length / storyFields.length) * 100),
  };
}

/**
 * 顯示進度
 */
function displayProgress(before, after) {
  console.log('\n' + '='.repeat(60));
  console.log('人物誌故事完成度');
  console.log('='.repeat(60));
  console.log(`更新前: ${before.filled}/${before.total} (${before.percentage}%)`);
  console.log(`更新後: ${after.filled}/${after.total} (${after.percentage}%)`);
  console.log(`新增故事: ${after.filled - before.filled} 則`);
  console.log('='.repeat(60));
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

    // 隱藏密碼輸入
    rl.stdoutMuted = true;
    rl.question('請輸入密碼: ', (password) => {
      rl.close();
      console.log(''); // 換行
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
 * 主程式
 */
async function main() {
  console.log('='.repeat(60));
  console.log('人物誌內容補完腳本');
  console.log('='.repeat(60));
  console.log(`API Base: ${API_BASE}`);

  // 檢查必要參數
  if (!EMAIL) {
    console.error('\n錯誤: 請提供 email');
    console.error('\n使用方式:');
    console.error('  node scripts/populate-biography.js <email> [password]');
    console.error('  或');
    console.error('  EMAIL=<email> PASSWORD=<password> node scripts/populate-biography.js');
    process.exit(1);
  }

  let password = PASSWORD;
  if (!password) {
    password = await readPassword();
  }

  try {
    // 1. 登入取得 token
    const accessToken = await login(EMAIL, password);

    // 2. 取得現有人物誌
    let biography = await getBiography(accessToken);
    const beforeProgress = biography ? calculateProgress(biography) : { filled: 0, total: 34, percentage: 0 };

    // 3. 建立或更新人物誌
    if (!biography) {
      // 建立新人物誌
      biography = await createBiography(accessToken, BIOGRAPHY_DATA);
    } else {
      // 更新現有人物誌
      biography = await updateBiography(accessToken, BIOGRAPHY_DATA);
    }

    // 4. 計算並顯示進度
    const afterProgress = calculateProgress(biography);
    displayProgress(beforeProgress, afterProgress);

    console.log('\n✓ 人物誌內容補完完成!');
    console.log(`\n可以前往以下網址查看:`);
    console.log(`https://nobodyclimb.cc/biography/${biography.slug || biography.id}`);

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

module.exports = { makeRequest, login, getBiography, createBiography, updateBiography };
