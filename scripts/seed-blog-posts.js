/**
 * 部落格測試文章種子腳本
 *
 * 使用方式：
 * 1. 在瀏覽器登入 nobodyclimb.cc
 * 2. 開啟開發者工具 (F12)
 * 3. 在 Console 貼上此腳本執行
 */

const API_BASE = 'https://api.nobodyclimb.cc/api/v1';

const posts = [
  // 1. 新手入門 (beginner)
  {
    title: '攀岩新手完全指南：從零開始的攀岩之路',
    slug: 'rock-climbing-beginner-complete-guide',
    excerpt: '想開始攀岩卻不知道從何下手？本文將帶你了解抱石與上攀的差異、必備裝備、以及新手必學的三大技巧。',
    content: `<h2>前言</h2>
<p>自從攀岩納入東京奧運的競技項目後，這項結合力與美的運動吸引了越來越多人的目光。如果你也對攀岩感到好奇，這篇文章將為你揭開攀岩世界的神秘面紗。</p>

<h2>抱石 vs 上攀：該選哪一個？</h2>
<p>攀岩最常見的兩種類型是「抱石」與「上攀」：</p>
<ul>
<li><strong>抱石（Bouldering）</strong>：岩壁高度約 3-4 公尺，地板有厚軟墊保護，不需要繩索確保，獨自一人也可以攀爬。</li>
<li><strong>上攀（Sport Climbing）</strong>：岩壁高度約 8-15 公尺，需要繩索、安全帶等確保裝備，通常需要兩人合作。</li>
</ul>
<p>對於新手來說，建議從室內抱石開始，門檻較低且相對安全。</p>

<h2>新手必備裝備</h2>
<h3>抱石裝備</h3>
<ul>
<li><strong>攀岩鞋</strong>：最重要的裝備！初次可先租用岩館公用鞋（約 80-100 元），若確定要持續攀爬，建議購買入門款岩鞋（約 1500-3000 元）。</li>
<li><strong>舒適運動服</strong>：好伸展的運動服即可，建議穿長褲避免擦傷。</li>
<li><strong>粉袋與止滑粉</strong>：吸附手汗、增加摩擦力，多數岩館都有提供。</li>
</ul>

<h3>上攀裝備</h3>
<p>除了攀岩鞋外，還需要：安全帶、確保器、有鎖鉤環、攀岩繩、頭盔（戶外攀岩）。</p>

<h2>新手三大基礎技巧</h2>
<h3>1. 三點支撐法則</h3>
<p>攀爬時，始終保持三個支點（兩手一腳或兩腳一手）接觸岩壁，這樣可以增加穩定性。</p>

<h3>2. 用腳不用手</h3>
<p>盡量用腿部推動身體，而不是完全依賴手臂拉扯。腿部比手臂更強壯且耐力更好。</p>

<h3>3. 重心貼牆</h3>
<p>攀爬時身體盡量靠近岩壁，減少重心偏移，可以節省大量手臂力量。</p>

<h2>推薦入門場地</h2>
<p>台灣目前有許多優質的室內攀岩館：</p>
<ul>
<li><strong>原岩攀岩館</strong>：全台共 6 間分店，設備完善，有專業教學課程。</li>
<li><strong>岩究所 double8</strong>：位於台北，Y17 館高達 12 公尺，仿戶外地形豐富。</li>
<li><strong>台北內湖運動中心</strong>：公立設施，價格親民。</li>
</ul>

<h2>結語</h2>
<p>攀岩是一項老少咸宜的運動，只要有一雙攀岩鞋，就能開始你的攀岩之旅。建議前幾次要有老手帶領，學習基本的安全知識和攀爬技巧。期待在岩館見到你！</p>`,
    category: 'beginner',
    tags: ['新手入門', '攀岩教學', '抱石'],
    status: 'published'
  },

  // 2. 新聞動態 (news)
  {
    title: '2025 全國青少年運動攀登錦標賽即將開跑',
    slug: '2025-national-youth-sport-climbing-championship',
    excerpt: '114學年度全國青少年運動攀登錦標賽將於年底舉行，採用 IFSC 最新比賽規則，優秀選手將有機會入選亞洲青少年錦標賽國家代表隊。',
    content: `<h2>賽事資訊</h2>
<p>由中華民國山岳協會主辦的「114學年度全國青少年運動攀登錦標賽」即將於今年度舉行，這是台灣攀岩界年度最重要的青少年賽事之一。</p>

<h2>比賽規則</h2>
<p>本競賽採用 2025 年度 IFSC（國際運動攀登總會）最新頒佈之國際正式比賽規則，比賽項目為個人難度賽：</p>
<ul>
<li>各組賽程含資格賽或複賽及決賽</li>
<li>除國小1-3年級組外，各組資格賽與複賽採上方確保攀登（Top-roping）或先鋒攀登（Leading）進行</li>
<li>決賽採先鋒攀登（Leading）進行</li>
</ul>

<h2>選拔機制</h2>
<p>表現優異之選手，將由選訓小組委員會依選手之攀登能力、體能及運動精神等條件，選拔為亞洲青少年錦標賽國家青少年代表隊培訓選手。這是年輕選手邁向國際舞台的重要踏板。</p>

<h2>2025 Max Asia 全國青少年抱石亞洲交流賽</h2>
<p>另一項值得關注的賽事是「2025 Max Asia 全國青少年抱石亞洲交流賽」，將於 114 年 8 月 23 日在新竹風城攀岩館勝利館舉行。</p>

<h3>參賽資格</h3>
<ul>
<li>年齡：9-16 歲青少年</li>
<li>國籍不限</li>
<li>未成年選手參賽須有家長同意書</li>
</ul>

<h3>報名費用</h3>
<ul>
<li>中華民國山岳協會團體會員之選手：每人 1,200 元</li>
<li>非會員選手：每人 1,800 元</li>
</ul>

<h2>國際賽事動態</h2>
<p>2025 年 IFSC 攀岩世界錦標賽將在韓國首爾舉行，台灣選手也將參與這場國際盛事，為國爭光。</p>

<h2>相關資訊</h2>
<p>如需更多比賽詳情或報名資訊，可至中華民國山岳協會運動攀登比賽系統網站 (ctaa.j91.me) 查詢。</p>`,
    category: 'news',
    tags: ['比賽', '青少年', '錦標賽'],
    status: 'published'
  },

  // 3. 裝備分享 (gear)
  {
    title: '攀岩裝備選購指南：從岩鞋到確保器一次搞懂',
    slug: 'rock-climbing-gear-buying-guide',
    excerpt: '攀岩裝備琳瑯滿目，新手該如何選擇？本文詳細介紹岩鞋、粉袋、確保器等必備裝備的選購要點與台灣購買管道。',
    content: `<h2>前言</h2>
<p>攀岩裝備是攀岩安全與表現的重要基礎。本文將為你詳細介紹各種攀岩裝備的功能與選購建議。</p>

<h2>攀岩鞋（岩鞋）</h2>
<h3>基本介紹</h3>
<p>岩鞋由類似輪胎的橡膠材質做為鞋底，功用為增加摩擦力與止滑。大部分室內攀岩場會強制規定必須穿著才可進行攀爬。</p>

<h3>款式分類</h3>
<ul>
<li><strong>魔鬼氈式</strong>：穿脫方便，適合初學者</li>
<li><strong>鞋帶式</strong>：可調整鬆緊，包覆性佳</li>
<li><strong>鬆緊帶式</strong>：專業款式，追求精準腳感</li>
</ul>

<h3>選購建議</h3>
<p>挑選攀岩鞋一定要試穿實體，原則上選擇能完全包覆住腳的鞋子，這樣更有利於踩踏岩點時的施力。新手預算約 2,000-3,000 元即可入手不錯的入門款。</p>

<h2>粉袋與止滑粉</h2>
<h3>功能</h3>
<p>粉袋內裝的是碳酸鎂粉，具有吸附汗水、乾燥、止滑的功用。容易出手汗的人會使用較多的粉。</p>

<h3>種類</h3>
<ul>
<li><strong>抱石粉袋</strong>：容量與袋口較大，放於地上使用</li>
<li><strong>先鋒（上攀）粉袋</strong>：袋口與容量較小，繫於後腰</li>
</ul>

<h2>確保器</h2>
<h3>功能</h3>
<p>確保器為上攀時，確保者使用的裝備，通常會與有鎖鉤環共同使用。</p>

<h3>種類</h3>
<ul>
<li><strong>自動確保器（如 GriGri）</strong>：制動原理類似汽車安全帶，較受新手喜愛但價格較高</li>
<li><strong>豬鼻子確保器（ATC）</strong>：需由確保者手動制動，較適合進階老手使用，價格較便宜</li>
</ul>

<h2>台灣購買管道</h2>
<ul>
<li><strong>Black Diamond Taiwan</strong>：提供完整攀岩裝備</li>
<li><strong>台北山水 TPSS</strong>：Petzl、Mammut、Black Diamond 等品牌</li>
<li><strong>登山補給站</strong>：各式攀岩裝備齊全</li>
<li><strong>double8</strong>：台灣在地攀岩品牌</li>
<li><strong>迪卡儂 Decathlon</strong>：入門款式平價選擇</li>
</ul>`,
    category: 'gear',
    tags: ['裝備', '岩鞋', '確保器'],
    status: 'published'
  },

  // 4. 技巧分享 (skills)
  {
    title: '攀岩技巧大全：腳法、重心與進階動作完整解析',
    slug: 'rock-climbing-techniques-complete-guide',
    excerpt: '想提升攀岩能力？掌握正確的腳法與重心控制是關鍵！本文分享新手到進階的實用攀岩技巧。',
    content: `<h2>前言</h2>
<p>攀岩不只是靠手臂力量，正確的技巧可以讓你事半功倍。本文將從基礎到進階，完整介紹攀岩的核心技巧。</p>

<h2>基本原則</h2>

<h3>三點支撐法則</h3>
<p>攀爬時，始終保持三個支點（兩手和一腳或兩腳和一手）接觸岩壁，這樣可以增加穩定性，減少滑落的風險。</p>

<h3>身體貼牆</h3>
<p>攀爬時應該盡量將身體靠近牆面，減少重心的偏移，使你更加穩定。重心盡量貼近岩壁，可以極大減輕手臂的負擔。</p>

<h2>腳法技巧</h2>

<h3>腳尖踩點</h3>
<p>盡量使用腳尖踩在岩點上，這樣可以讓你更靈活地轉動身體並保持平衡。</p>

<h3>Heel Hook（腳跟鉤）</h3>
<p>將腳跟支撐在岩點上，接替手臂的負重。常用在陡坡和懸岩地勢。</p>

<h3>Toe Hook（腳尖鉤）</h3>
<p>用腳尖上緣勾住岩點，增加身體穩定性。</p>

<h2>進階動作技巧</h2>

<h3>旗幟動作（Flagging）</h3>
<p>當身體需要保持平衡時，將一隻腳伸到牆外，像旗幟一樣支撐身體，有助於減少擺動並保持穩定。</p>

<h3>膝蓋棒（Knee Bar）</h3>
<p>利用膝蓋和腳的反作用力創造穩定的支撐點，有助於獲得短暫休息。</p>

<h3>青蛙步（Frog Step）</h3>
<p>保持身體正對岩壁，兩腿同時伸長，以觸及到更高的把手點。</p>

<h2>節省體力的技巧</h2>

<h3>使用腿部力量</h3>
<p>盡量用腿部推動自己，而不是完全依賴手臂拉扯，因為腿部比手臂更強壯且耐力更好。</p>

<h3>靜態移動</h3>
<p>在牆上移動時，盡量保持動作平穩和可控。避免快速或劇烈的移動，可以節省體力並保持平衡。</p>`,
    category: 'skills',
    tags: ['技巧', '腳法', '教學'],
    status: 'published'
  },

  // 5. 訓練計畫 (training)
  {
    title: '攀岩者的體能訓練指南：指力、核心與全身鍛鍊',
    slug: 'rock-climbing-training-guide',
    excerpt: '想提升攀岩表現？除了多爬之外，有系統的體能訓練也很重要。本文介紹指力板訓練、核心訓練等攀岩專項訓練方法。',
    content: `<h2>前言</h2>
<p>攀岩是全身性的運動，能鍛鍊到前臂、二頭肌、三頭肌、三角肌、背闊肌、斜方肌、腿部，甚至是手指。「攀岩是快速鍛鍊上身和核心力量的絕佳方法。」</p>

<h2>攀岩訓練三要素</h2>
<ul>
<li><strong>耐力</strong>：長時間攀爬的持久力</li>
<li><strong>力量</strong>：抓握與拉引的絕對力量</li>
<li><strong>爆發力</strong>：動態移動的瞬間力量</li>
</ul>

<h2>指力訓練</h2>

<h3>指力板（Hangboard）訓練</h3>
<p>指力板是攀岩者最常用的訓練器材。推薦使用 Crimpd App，裡面包含各種不同的指力、上肢、核心、甚至攀爬的課表。</p>

<h3>基礎課表範例</h3>
<ul>
<li>使用深 20mm 的三指洞</li>
<li>3 Finger Half Crimp 吊掛 10 秒</li>
<li>休息 20 秒</li>
<li>重複 6 組</li>
</ul>

<h2>核心訓練</h2>
<p>推薦動作：</p>
<ul>
<li>平板撐（Plank）</li>
<li>懸吊抬腿（Hanging Leg Raise）</li>
<li>俄羅斯轉體（Russian Twist）</li>
<li>死蟲式（Dead Bug）</li>
</ul>

<h2>拮抗肌訓練</h2>
<p>攀岩主要使用拉的動作，因此需要訓練：</p>
<ul>
<li>推的動作：伏地挺身、肩推</li>
<li>手腕伸展訓練</li>
<li>旋轉肌群訓練</li>
</ul>`,
    category: 'training',
    tags: ['訓練', '指力', '核心'],
    status: 'published'
  },

  // 6. 路線攻略 (routes)
  {
    title: '龍洞經典路線攻略：從入門到進階的完美選擇',
    slug: 'longdong-classic-routes-guide',
    excerpt: '龍洞是台灣最具規模的天然岩場，擁有超過 600 條攀登路線。本文精選適合不同程度攀岩者的經典路線。',
    content: `<h2>前言</h2>
<p>龍洞岩場位於新北市貢寮區，岩岸全長約 2 公里，岩壁最高處約 80 公尺。自 1978 年首度發現以來，發展迄今已近 50 年，累積約 600 條攀登路線，是全台最具規模的天然岩場。</p>

<h2>路線難度分級</h2>
<p>龍洞路線難度從 YDS 5.4 至 5.14a 不等，包含：</p>
<ul>
<li>運動攀登路線</li>
<li>傳統攀登路線</li>
<li>抱石路線</li>
<li>落水攀登路線（Deep Water Solo）</li>
</ul>

<h2>入門級路線推薦（5.4 - 5.8）</h2>

<h3>校門口區</h3>
<p>這裡是龍洞最適合新手的區域，路線相對簡單且確保點完善。</p>
<ul>
<li><strong>小乖乖</strong>（5.6）：經典入門路線，手點大且明顯</li>
<li><strong>乖乖</strong>（5.7）：稍具挑戰，適合有基礎的新手</li>
</ul>

<h2>中級路線推薦（5.9 - 5.11）</h2>
<ul>
<li><strong>黃乖乖</strong>（5.9）：技巧性路線，需要良好的腳法</li>
<li><strong>蝴蝶夢</strong>（5.10b）：經典中級路線，變化豐富</li>
</ul>

<h2>安全注意事項</h2>
<ul>
<li>戶外攀岩務必配戴頭盔</li>
<li>確認 bolt 狀態，老舊 bolt 需特別注意</li>
<li>注意潮汐與天候變化</li>
<li>建議與有經驗者同行</li>
</ul>`,
    category: 'routes',
    tags: ['路線', '龍洞', '戶外攀岩'],
    status: 'published'
  },

  // 7. 岩場開箱 (crags)
  {
    title: '台灣四大戶外岩場完整介紹：龍洞、大砲岩、熱海、關子嶺',
    slug: 'taiwan-top-4-outdoor-climbing-crags',
    excerpt: '台灣擁有豐富的天然岩場資源，從北到南都有精彩的攀岩場地。本文帶你認識台灣最具代表性的四大戶外岩場。',
    content: `<h2>前言</h2>
<p>台灣雖然面積不大，卻擁有多樣化的天然岩場。從北海岸的龍洞到南部的關子嶺，各具特色的岩場讓攀岩者有豐富的選擇。</p>

<h2>龍洞岩場</h2>
<ul>
<li><strong>位置</strong>：新北市貢寮區</li>
<li><strong>岩質</strong>：四棱砂岩</li>
<li><strong>路線數</strong>：約 600 條</li>
<li><strong>難度範圍</strong>：5.4 - 5.14a</li>
</ul>
<p>世界數一數二的臨海岩場，發展迄今已近50年。</p>

<h2>大砲岩</h2>
<ul>
<li><strong>位置</strong>：台北市北投區（陽明山國家公園內）</li>
<li><strong>岩質</strong>：安山岩</li>
<li><strong>開放狀態</strong>：2019年11月重新開放</li>
</ul>
<p>北部三大天然岩場之一，追溯自日治時期 1930 年代。</p>

<h2>熱海攀岩場</h2>
<ul>
<li><strong>位置</strong>：台北市北投區</li>
<li><strong>岩壁高度</strong>：約 15 公尺</li>
</ul>
<p>離台北市區最近的天然攀岩場，適合初學者。</p>

<h2>關子嶺岩場</h2>
<ul>
<li><strong>位置</strong>：台南市白河區</li>
<li><strong>岩質</strong>：石灰岩</li>
<li><strong>難度範圍</strong>：入門至 5.14a</li>
</ul>
<p>中南部最具規模的天然石灰岩岩場，冬天是最佳季節。</p>`,
    category: 'crags',
    tags: ['岩場', '戶外攀岩', '龍洞'],
    status: 'published'
  },

  // 8. 岩館開箱 (gyms)
  {
    title: '原岩攀岩館全攻略：六間分店完整介紹與體驗心得',
    slug: 'tup-climbing-gym-complete-guide',
    excerpt: '原岩攀岩館是台灣最大的連鎖攀岩館品牌，共有六間分店。本文詳細介紹各分店特色、票價資訊與攀爬心得。',
    content: `<h2>前言</h2>
<p>原岩攀岩館於 2015 年 8 月成立，目前共有 6 間分店，致力於推廣攀岩運動、讓更多人體驗攀岩所帶來的樂趣。</p>

<h2>分店總覽</h2>
<h3>抱石館</h3>
<ul>
<li>萬華店</li>
<li>南港店</li>
<li>明德店</li>
</ul>

<h3>上攀 + 抱石館</h3>
<ul>
<li>中和店</li>
<li>A19 店</li>
<li>新店店</li>
</ul>

<h2>明德店票價</h2>
<ul>
<li>平日全日票 $500</li>
<li>下午 12:00-18:00 $350</li>
<li>晚上 17:00-23:00 $450</li>
<li>星光 20:30-23:00 $320</li>
<li>假日全日票 $550</li>
<li>岩鞋租借 $100</li>
</ul>

<h2>特色</h2>
<ul>
<li>室內有多角度的牆面攀登</li>
<li>會不定時更新場內路線</li>
<li>提供抱石教學、兒童及青少年教學</li>
<li>中和店、新店店、A19 店設有自動確保器</li>
</ul>`,
    category: 'gyms',
    tags: ['岩館', '原岩', '抱石'],
    status: 'published'
  },

  // 9. 攀岩旅遊 (travel)
  {
    title: '泰國喀比攀岩之旅：Railay 半島攀岩天堂完整攻略',
    slug: 'thailand-krabi-railay-rock-climbing-guide',
    excerpt: '泰國喀比 Railay 半島被譽為攀岩天堂，擁有超過 700 條攀岩路線。本文分享從台灣出發的完整攻略，包含交通、住宿、攀岩課程推薦。',
    content: `<h2>前言</h2>
<p>如果你在室內岩館練習了一段時間，想要體驗戶外天然岩壁的魅力，泰國喀比的 Railay 半島絕對是最佳選擇之一。</p>

<h2>為什麼選擇喀比？</h2>
<ul>
<li>超過 700 條攀岩路線</li>
<li>難度從入門 5.6 到專家級 5.14b 都有</li>
<li>壯觀的喀斯特地形，岩石型態多樣化</li>
<li>從台灣出發航程約 4 小時</li>
<li>物價親民，性價比高</li>
</ul>

<h2>地理位置與交通</h2>
<p>Railay 是一個「半島」，從泰國本島沒辦法陸路過去，一定要搭長尾船（long tail boat），航行約 15 分鐘，每人單程 100 泰銖。</p>

<h2>簽證資訊</h2>
<p>台灣人去泰國可以使用落地簽，可停留 15 天。</p>

<h2>最佳旅遊季節</h2>
<ul>
<li><strong>夏季（2-5月）</strong>：氣溫較熱</li>
<li><strong>雨季（6-9月）</strong>：不建議攀岩</li>
<li><strong>冬季（10-12月）</strong>：最佳季節</li>
</ul>`,
    category: 'travel',
    tags: ['旅遊', '泰國', '喀比'],
    status: 'published'
  },

  // 10. 賽事介紹 (competition)
  {
    title: '認識攀岩比賽：從岩館業餘賽到奧運殿堂',
    slug: 'understanding-rock-climbing-competitions',
    excerpt: '攀岩自東京奧運成為正式項目後備受矚目。本文介紹攀岩比賽的種類、規則，以及台灣的攀岩賽事資訊。',
    content: `<h2>攀岩比賽三大項目</h2>

<h3>1. 難度賽（Lead Climbing）</h3>
<ul>
<li>攀爬 15 公尺以上的高牆</li>
<li>以攀登的高度計算成績</li>
<li>通常限時 6 分鐘</li>
</ul>

<h3>2. 抱石賽（Bouldering）</h3>
<ul>
<li>在限時內攀爬多條短路線</li>
<li>計分：完成路線數與嘗試次數</li>
<li>每條路線約 4-5 分鐘</li>
</ul>

<h3>3. 速度賽（Speed Climbing）</h3>
<ul>
<li>在標準化的 15 公尺牆面比快</li>
<li>世界紀錄：男子約 5 秒，女子約 7 秒</li>
</ul>

<h2>台灣攀岩賽事</h2>
<ul>
<li><strong>全國運動會攀岩項目</strong>：四年一度</li>
<li><strong>全國青少年運動攀登錦標賽</strong>：每年舉辦</li>
<li><strong>全國抱石錦標賽</strong>：年度盛事</li>
</ul>`,
    category: 'competition',
    tags: ['比賽', '錦標賽', '奧運'],
    status: 'published'
  },

  // 11. 活動介紹 (events)
  {
    title: '2025 台灣攀岩活動總整理：課程、體驗、工作坊',
    slug: '2025-taiwan-rock-climbing-events-guide',
    excerpt: '想要學習攀岩或精進技術？本文整理 2025 年台灣各地攀岩館的課程、體驗活動與工作坊資訊。',
    content: `<h2>新手體驗課程</h2>

<h3>原岩攀岩館體驗課程</h3>
<ul>
<li>基礎安全知識、攀爬技巧教學、實際攀爬練習</li>
<li>時長約 2 小時</li>
<li>適合完全新手</li>
</ul>

<h3>岩究所 double8 體驗</h3>
<ul>
<li>Y17 館高達 12 公尺</li>
<li>3 歲以上皆可入場</li>
</ul>

<h2>技巧進階課程</h2>
<ul>
<li>初階確保課程</li>
<li>進階確保課程</li>
<li>腳法訓練</li>
<li>動態動作練習</li>
</ul>

<h2>兒童與青少年課程</h2>
<ul>
<li>原岩攀岩冬令營</li>
<li>幼兒/兒童/成人抱石課程</li>
</ul>

<h2>戶外攀岩活動</h2>
<ul>
<li>GO Formosa 戶外訓練學校</li>
<li>龍洞戶外體驗</li>
</ul>`,
    category: 'events',
    tags: ['活動', '課程', '體驗'],
    status: 'published'
  },

  // 12. 社群資源 (community)
  {
    title: '台灣攀岩社群指南：協會、粉專、論壇一次掌握',
    slug: 'taiwan-rock-climbing-community-guide',
    excerpt: '想融入台灣攀岩圈？本文整理各大攀岩協會、社群媒體、線上資源，幫助你找到岩友、獲取最新資訊。',
    content: `<h2>官方協會</h2>

<h3>臺灣戶外攀岩協會（TOCC）</h3>
<ul>
<li>專注領域：戶外攀岩活動，特別是龍洞岩場</li>
<li>龍洞岩場資源維護與管理</li>
<li>官網：tocc-climbing.org</li>
</ul>

<h3>中華民國山岳協會</h3>
<ul>
<li>主辦全國性攀岩比賽</li>
<li>選手培訓與選拔</li>
<li>比賽系統：ctaa.j91.me</li>
</ul>

<h2>攀岩館社群</h2>
<ul>
<li><strong>原岩攀岩館</strong>：@tupclimbing</li>
<li><strong>岩究所 double8</strong>：@double8y17climbing</li>
</ul>

<h2>如何融入社群</h2>
<ol>
<li>固定去同一家岩館</li>
<li>參加岩館活動</li>
<li>主動打招呼</li>
<li>加入線上社團</li>
<li>參加戶外體驗</li>
</ol>`,
    category: 'community',
    tags: ['社群', '協會', '資源'],
    status: 'published'
  },

  // 13. 傷害防護 (injury)
  {
    title: '攀岩傷害預防與復健：保護你的手指與關節',
    slug: 'rock-climbing-injury-prevention-rehabilitation',
    excerpt: '攀岩是高強度的手指運動，受傷風險不可忽視。本文介紹常見攀岩傷害的預防方法與復健知識。',
    content: `<h2>攀岩常見傷害</h2>

<h3>手指傷害</h3>
<ul>
<li>滑輪韌帶拉傷：最常見的攀岩傷害</li>
<li>肌腱炎：過度使用導致發炎</li>
<li>關節扭傷：錯誤施力或墜落造成</li>
</ul>

<h2>傷害預防方法</h2>

<h3>充分熱身</h3>
<ul>
<li>全身性有氧運動（5-10 分鐘）</li>
<li>手指關節活動</li>
<li>從簡單路線開始暖身</li>
</ul>

<h3>漸進式訓練</h3>
<ul>
<li>不要一開始就挑戰極限難度</li>
<li>讓手指有時間適應強度</li>
</ul>

<h2>受傷後處理</h2>

<h3>急性期（受傷後 1 週內）</h3>
<ul>
<li>休息：停止攀岩活動</li>
<li>冰敷：每次 15-20 分鐘</li>
<li>避免推拿：急性期推拿可能加劇症狀</li>
</ul>

<h2>何時該就醫</h2>
<ul>
<li>劇烈疼痛且持續不退</li>
<li>明顯腫脹或變形</li>
<li>無法正常活動</li>
<li>休息後仍不見好轉</li>
</ul>`,
    category: 'injury',
    tags: ['傷害', '復健', '預防'],
    status: 'published'
  }
];

async function getAuthToken() {
  // 從 cookie 取得 token
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token' || name === 'token') {
      return value;
    }
  }

  // 如果沒有 cookie，嘗試從 localStorage 取得
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) return token;

  throw new Error('找不到認證 token，請先登入');
}

async function createPost(post, token) {
  const response = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(post)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`創建文章失敗: ${error.message || response.statusText}`);
  }

  return response.json();
}

async function seedPosts() {
  console.log('開始創建測試文章...');

  let token;
  try {
    token = await getAuthToken();
  } catch (e) {
    console.error(e.message);
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const post of posts) {
    try {
      console.log(`創建文章: ${post.title}`);
      await createPost(post, token);
      successCount++;
      console.log(`✓ 成功: ${post.title}`);
    } catch (error) {
      failCount++;
      console.error(`✗ 失敗: ${post.title} - ${error.message}`);
    }

    // 稍微延遲避免 rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n完成！成功: ${successCount}, 失敗: ${failCount}`);
}

// 執行腳本
seedPosts();
