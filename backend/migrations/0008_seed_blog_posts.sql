-- Seed blog posts for testing (13 articles, one for each category)
-- Author: vincentxu (996bf611399e5ee8594a478909dd4db9)

-- 1. 新手入門 (beginner)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_beginner_001',
  '996bf611399e5ee8594a478909dd4db9',
  '攀岩新手完全指南：從零開始的攀岩之路',
  'rock-climbing-beginner-complete-guide',
  '想開始攀岩卻不知道從何下手？本文將帶你了解抱石與上攀的差異、必備裝備、以及新手必學的三大技巧。',
  '<h2>前言</h2>
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
<p>攀岩是一項老少咸宜的運動，只要有一雙攀岩鞋，就能開始你的攀岩之旅。建議前幾次要有老手帶領，學習基本的安全知識和攀爬技巧。期待在岩館見到你！</p>',
  'beginner',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_beginner_001', '新手入門');
INSERT INTO post_tags (post_id, tag) VALUES ('post_beginner_001', '攀岩教學');
INSERT INTO post_tags (post_id, tag) VALUES ('post_beginner_001', '抱石');

-- 2. 新聞動態 (news)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_news_001',
  '996bf611399e5ee8594a478909dd4db9',
  '2025 全國青少年運動攀登錦標賽即將開跑',
  '2025-national-youth-sport-climbing-championship',
  '114學年度全國青少年運動攀登錦標賽將於年底舉行，採用 IFSC 最新比賽規則，優秀選手將有機會入選亞洲青少年錦標賽國家代表隊。',
  '<h2>賽事資訊</h2>
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
<p>如需更多比賽詳情或報名資訊，可至中華民國山岳協會運動攀登比賽系統網站 (ctaa.j91.me) 查詢。</p>',
  'news',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_news_001', '比賽');
INSERT INTO post_tags (post_id, tag) VALUES ('post_news_001', '青少年');
INSERT INTO post_tags (post_id, tag) VALUES ('post_news_001', '錦標賽');

-- 3. 裝備分享 (gear)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_gear_001',
  '996bf611399e5ee8594a478909dd4db9',
  '攀岩裝備選購指南：從岩鞋到確保器一次搞懂',
  'rock-climbing-gear-buying-guide',
  '攀岩裝備琳瑯滿目，新手該如何選擇？本文詳細介紹岩鞋、粉袋、確保器等必備裝備的選購要點與台灣購買管道。',
  '<h2>前言</h2>
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

<h2>安全帶</h2>
<p>上攀必備裝備，用於連接攀登者與確保系統。選購時需注意：</p>
<ul>
<li>舒適度與包覆性</li>
<li>腰環與腿環的可調整性</li>
<li>裝備環的數量與位置</li>
</ul>

<h2>台灣購買管道</h2>
<ul>
<li><strong>Black Diamond Taiwan</strong>：提供完整攀岩裝備</li>
<li><strong>台北山水 TPSS</strong>：Petzl、Mammut、Black Diamond 等品牌</li>
<li><strong>登山補給站</strong>：各式攀岩裝備齊全</li>
<li><strong>double8</strong>：台灣在地攀岩品牌</li>
<li><strong>迪卡儂 Decathlon</strong>：入門款式平價選擇</li>
<li><strong>綠野山房</strong>：戶外用品專門店</li>
</ul>

<h2>結語</h2>
<p>裝備是攀岩安全的保障，建議新手先從基本的岩鞋開始，隨著技術進步再逐步添購其他裝備。購買前務必做好功課，選擇適合自己的裝備。</p>',
  'gear',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_gear_001', '裝備');
INSERT INTO post_tags (post_id, tag) VALUES ('post_gear_001', '岩鞋');
INSERT INTO post_tags (post_id, tag) VALUES ('post_gear_001', '確保器');

-- 4. 技巧分享 (skills)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_skills_001',
  '996bf611399e5ee8594a478909dd4db9',
  '攀岩技巧大全：腳法、重心與進階動作完整解析',
  'rock-climbing-techniques-complete-guide',
  '想提升攀岩能力？掌握正確的腳法與重心控制是關鍵！本文分享新手到進階的實用攀岩技巧。',
  '<h2>前言</h2>
<p>攀岩不只是靠手臂力量，正確的技巧可以讓你事半功倍。本文將從基礎到進階，完整介紹攀岩的核心技巧。</p>

<h2>基本原則</h2>

<h3>三點支撐法則</h3>
<p>攀爬時，始終保持三個支點（兩手和一腳或兩腳和一手）接觸岩壁，這樣可以增加穩定性，減少滑落的風險。</p>

<h3>身體貼牆</h3>
<p>攀爬時應該盡量將身體靠近牆面，減少重心的偏移，使你更加穩定。重心盡量貼近岩壁，可以極大減輕手臂的負擔。</p>

<h2>腳法技巧</h2>

<h3>腳尖踩點</h3>
<p>盡量使用腳尖踩在岩點上，這樣可以讓你更靈活地轉動身體並保持平衡。</p>

<h3>精確踩踏</h3>
<p>腳步的精確度非常重要。踩點時要看清楚目標，確保踩準，可以有效減少腳滑的風險。</p>

<h3>Heel Hook（腳跟鉤）</h3>
<p>將腳跟支撐在岩點上，接替手臂的負重。常用在陡坡和懸岩地勢。</p>

<h3>Toe Hook（腳尖鉤）</h3>
<p>用腳尖上緣勾住岩點，增加身體穩定性。</p>

<h3>Smear（摩擦踩點）</h3>
<p>岩壁上沒有好腳點時，用岩鞋底平面的摩擦力粘住岩面。</p>

<h2>重心控制</h2>

<p>讓攀岩持續進步最重要的關鍵，在於精通：</p>
<ul>
<li>重心位置的掌握</li>
<li>重心移動的流暢度</li>
<li>動力鏈的運用</li>
<li>體重朝牆壁傾倒的控制</li>
</ul>

<h2>進階動作技巧</h2>

<h3>旗幟動作（Flagging）</h3>
<p>當身體需要保持平衡時，將一隻腳伸到牆外，像旗幟一樣支撐身體，有助於減少擺動並保持穩定。</p>

<h3>膝蓋棒（Knee Bar）</h3>
<p>利用膝蓋和腳的反作用力創造穩定的支撐點，有助於獲得短暫休息。</p>

<h3>自行車（Bicycle）</h3>
<p>將一隻腳踩在岩點上，另一隻腳從下方勾住，同時用雙腳擠壓岩點以保持穩定。</p>

<h3>青蛙步（Frog Step）</h3>
<p>保持身體正對岩壁，兩腿同時伸長，以觸及到更高的把手點。</p>

<h2>節省體力的技巧</h2>

<h3>使用腿部力量</h3>
<p>盡量用腿部推動自己，而不是完全依賴手臂拉扯，因為腿部比手臂更強壯且耐力更好。</p>

<h3>靜態移動</h3>
<p>在牆上移動時，盡量保持動作平穩和可控。避免快速或劇烈的移動，可以節省體力並保持平衡。</p>

<h3>尋找休息點</h3>
<p>善用攀爬過程中的休息點，讓你短暫放鬆，恢復部分體力。</p>

<h2>結語</h2>
<p>攀岩技巧需要不斷練習才能內化。建議每次攀岩都專注練習一到兩個技巧，久而久之就能自然運用。記住，核心力量在重心轉移時扮演重要角色，平時也要加強核心訓練。</p>',
  'skills',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_skills_001', '技巧');
INSERT INTO post_tags (post_id, tag) VALUES ('post_skills_001', '腳法');
INSERT INTO post_tags (post_id, tag) VALUES ('post_skills_001', '教學');

-- 5. 訓練計畫 (training)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_training_001',
  '996bf611399e5ee8594a478909dd4db9',
  '攀岩者的體能訓練指南：指力、核心與全身鍛鍊',
  'rock-climbing-training-guide',
  '想提升攀岩表現？除了多爬之外，有系統的體能訓練也很重要。本文介紹指力板訓練、核心訓練等攀岩專項訓練方法。',
  '<h2>前言</h2>
<p>攀岩是全身性的運動，能鍛鍊到前臂、二頭肌、三頭肌、三角肌、背闊肌、斜方肌、腿部，甚至是手指。「攀岩是快速鍛鍊上身和核心力量的絕佳方法。」</p>

<h2>攀岩訓練三要素</h2>
<p>攀岩訓練包括三個肌肉功能：</p>
<ul>
<li><strong>耐力</strong>：長時間攀爬的持久力</li>
<li><strong>力量</strong>：抓握與拉引的絕對力量</li>
<li><strong>爆發力</strong>：動態移動的瞬間力量</li>
</ul>
<p>若欠缺某樣，可能會無法按照自己想攀登的模式攀登。</p>

<h2>指力訓練</h2>

<h3>指力板（Hangboard）訓練</h3>
<p>指力板是攀岩者最常用的訓練器材。推薦使用 Crimpd App，裡面包含各種不同的指力、上肢、核心、甚至攀爬的課表。</p>

<h3>基礎課表範例</h3>
<p>「Sub-max」指力訓練課表：</p>
<ul>
<li>使用深 20mm 的三指洞</li>
<li>3 Finger Half Crimp 吊掛 10 秒</li>
<li>休息 20 秒</li>
<li>重複 6 組</li>
</ul>

<h3>注意事項</h3>
<p>指力訓練對手指負擔很大，建議：</p>
<ul>
<li>攀岩經驗至少半年以上再開始</li>
<li>循序漸進增加強度</li>
<li>訓練前充分熱身</li>
<li>出現疼痛立即停止</li>
</ul>

<h2>核心訓練</h2>
<p>在攀岩中移動、重心轉移時，需要靠核心力量來穩定全身。推薦動作：</p>
<ul>
<li>平板撐（Plank）</li>
<li>懸吊抬腿（Hanging Leg Raise）</li>
<li>俄羅斯轉體（Russian Twist）</li>
<li>死蟲式（Dead Bug）</li>
</ul>

<h2>拮抗肌訓練</h2>
<p>進行交叉訓練時，進行相反的動作和對立的肌肉很重要。攀岩主要使用拉的動作，因此需要訓練：</p>
<ul>
<li>推的動作：伏地挺身、肩推</li>
<li>手腕伸展訓練</li>
<li>旋轉肌群訓練</li>
</ul>

<h2>握力訓練</h2>
<p>手的力量通常是限制因素，一旦抓地力消失，就無法完成攀爬。每週在健身房進行一到兩次鍛煉可能是有益的：</p>
<ul>
<li>握力器訓練</li>
<li>農夫走路</li>
<li>毛巾引體向上</li>
</ul>

<h2>訓練器材推薦</h2>
<p>HANCHOR 分享的五種實用訓練小玩具：</p>
<ul>
<li>指力板</li>
<li>握力器</li>
<li>彈力帶</li>
<li>訓練球</li>
<li>平衡板</li>
</ul>
<p>這些器材方便攜帶，可以讓攀岩者隨時訓練。</p>

<h2>台灣訓練場地</h2>
<p>除了各攀岩館，以下場地也適合進行攀岩訓練：</p>
<ul>
<li><strong>Y17 岩究所</strong>：全台第一個室內攀岩場，高達 12 公尺</li>
<li><strong>健身工廠</strong>：部分分店設有攀岩牆與專業課程</li>
</ul>

<h2>結語</h2>
<p>訓練是攀岩進步的關鍵，但也要注意休息與恢復。建議將這些訓練當作練習攀岩的補充，在攀岩之後或平日進行。記得保持耐心，進步需要時間！</p>',
  'training',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_training_001', '訓練');
INSERT INTO post_tags (post_id, tag) VALUES ('post_training_001', '指力');
INSERT INTO post_tags (post_id, tag) VALUES ('post_training_001', '核心');

-- 6. 路線攻略 (routes)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_routes_001',
  '996bf611399e5ee8594a478909dd4db9',
  '龍洞經典路線攻略：從入門到進階的完美選擇',
  'longdong-classic-routes-guide',
  '龍洞是台灣最具規模的天然岩場，擁有超過 600 條攀登路線。本文精選適合不同程度攀岩者的經典路線。',
  '<h2>前言</h2>
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

<h3>音乐厅區</h3>
<ul>
<li><strong>音樂課</strong>（5.5）：路線短但有趣，適合熱身</li>
</ul>

<h2>中級路線推薦（5.9 - 5.11）</h2>

<h3>大礁溪區</h3>
<p>路線豐富多變，是練習的好地方。</p>
<ul>
<li><strong>黃乖乖</strong>（5.9）：技巧性路線，需要良好的腳法</li>
<li><strong>紅乖乖</strong>（5.10a）：挑戰性增加，考驗耐力</li>
</ul>

<h3>半屏區</h3>
<ul>
<li><strong>蝴蝶夢</strong>（5.10b）：經典中級路線，變化豐富</li>
<li><strong>飛越乖乖</strong>（5.10c）：需要良好的動態能力</li>
</ul>

<h2>進階路線推薦（5.12 以上）</h2>

<h3>大砲區</h3>
<ul>
<li><strong>黑乖乖</strong>（5.12a）：技術與力量並重</li>
<li><strong>超乖乖</strong>（5.12c）：龍洞經典硬路線</li>
</ul>

<h2>安全注意事項</h2>
<ul>
<li>戶外攀岩務必配戴頭盔</li>
<li>確認 bolt 狀態，老舊 bolt 需特別注意</li>
<li>注意潮汐與天候變化</li>
<li>攜帶足夠的水和食物</li>
<li>建議與有經驗者同行</li>
</ul>

<h2>交通資訊</h2>
<p>從台北出發：</p>
<ul>
<li>開車：走國道一號接台62線，約1.5小時</li>
<li>大眾運輸：搭火車到福隆站，再轉搭計程車</li>
</ul>

<h2>相關資源</h2>
<p>臺灣戶外攀岩協會（TOCC）發展出龍洞岩場的自主管理模式，累積並維護相關資源。可至官網查詢更多路線資訊。</p>',
  'routes',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_routes_001', '路線');
INSERT INTO post_tags (post_id, tag) VALUES ('post_routes_001', '龍洞');
INSERT INTO post_tags (post_id, tag) VALUES ('post_routes_001', '戶外攀岩');

-- 7. 岩場開箱 (crags)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_crags_001',
  '996bf611399e5ee8594a478909dd4db9',
  '台灣四大戶外岩場完整介紹：龍洞、大砲岩、熱海、關子嶺',
  'taiwan-top-4-outdoor-climbing-crags',
  '台灣擁有豐富的天然岩場資源，從北到南都有精彩的攀岩場地。本文帶你認識台灣最具代表性的四大戶外岩場。',
  '<h2>前言</h2>
<p>台灣雖然面積不大，卻擁有多樣化的天然岩場。從北海岸的龍洞到南部的關子嶺，各具特色的岩場讓攀岩者有豐富的選擇。</p>

<h2>龍洞岩場</h2>

<h3>基本資訊</h3>
<ul>
<li><strong>位置</strong>：新北市貢寮區</li>
<li><strong>岩質</strong>：四棱砂岩</li>
<li><strong>路線數</strong>：約 600 條</li>
<li><strong>難度範圍</strong>：5.4 - 5.14a</li>
</ul>

<h3>特色</h3>
<p>長約兩公里的龍洞岩場是世界數一數二的臨海岩場，四棱砂岩質地堅硬。因為開發時程長，發展迄今已近50年，加上臺灣戶外攀岩協會發展出自主管理模式，讓龍洞成為全台最具規模的天然岩場。</p>

<h3>攀登類型</h3>
<p>運動攀登、傳統攀登、抱石、落水攀登（DWS）皆可。</p>

<h2>大砲岩</h2>

<h3>基本資訊</h3>
<ul>
<li><strong>位置</strong>：台北市北投區（陽明山國家公園內）</li>
<li><strong>岩質</strong>：安山岩</li>
<li><strong>開放狀態</strong>：2019年11月重新開放</li>
</ul>

<h3>特色</h3>
<p>大砲岩舊稱「天狗岩」、「鷹岩」，追溯自日治時期 1930 年代即開發成天然岩場，是北部三大天然岩場之一，也是攀岩愛好者的聖地。</p>

<h3>交通方式</h3>
<ul>
<li>搭乘捷運至石牌站，轉搭 508、536 公車至惇敘工商（行義）站下車，步行約 9 分鐘</li>
<li>搭乘捷運至新北投站，轉搭 230 公車至大磺嘴站下車，步行 2 分鐘</li>
</ul>

<h2>熱海攀岩場</h2>

<h3>基本資訊</h3>
<ul>
<li><strong>位置</strong>：台北市北投區</li>
<li><strong>岩壁高度</strong>：約 15 公尺</li>
<li><strong>難度</strong>：相對簡單</li>
</ul>

<h3>特色</h3>
<p>熱海攀岩場是離台北市區最近的天然攀岩場，雖然路線不多，但交通方便。天然裸露岩壁看起來雖然陡峭，但難度不高，是初學者接觸戶外攀岩的絕佳場域。</p>

<h2>關子嶺岩場</h2>

<h3>基本資訊</h3>
<ul>
<li><strong>位置</strong>：台南市白河區關子嶺風景區</li>
<li><strong>岩質</strong>：石灰岩</li>
<li><strong>難度範圍</strong>：入門至 5.14a</li>
</ul>

<h3>特色</h3>
<p>關子嶺岩場位在知名景點「水火同源」附近，1996年由嘉義岩友謝遠龍開發。此岩場屬石灰岩地形，岩壁樣貌變化多端，是中南部最具規模的天然石灰岩岩場。</p>

<h3>區域劃分</h3>
<p>主要分為：終極岩、飛來石、集合場、神秘谷、蓬萊島、毒刺林等區塊，每區含 5-10 條路線。</p>

<h3>最佳季節</h3>
<p>冬天的關子嶺是攀岩者的天堂（夏天是蚊子天堂）。建議 10 月至隔年 3 月前往。</p>

<h2>結語</h2>
<p>每個岩場都有其獨特的魅力與挑戰。建議從大砲岩或熱海開始體驗戶外攀岩，累積經驗後再挑戰龍洞與關子嶺的進階路線。記得遵守岩場規範，愛護自然環境。</p>',
  'crags',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_crags_001', '岩場');
INSERT INTO post_tags (post_id, tag) VALUES ('post_crags_001', '戶外攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('post_crags_001', '龍洞');

-- 8. 岩館開箱 (gyms)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_gyms_001',
  '996bf611399e5ee8594a478909dd4db9',
  '原岩攀岩館全攻略：六間分店完整介紹與體驗心得',
  'tup-climbing-gym-complete-guide',
  '原岩攀岩館是台灣最大的連鎖攀岩館品牌，共有六間分店。本文詳細介紹各分店特色、票價資訊與攀爬心得。',
  '<h2>前言</h2>
<p>原岩攀岩館於 2015 年 8 月成立，目前共有 6 間分店，致力於推廣攀岩運動、讓更多人體驗攀岩所帶來的樂趣。無論是上攀或抱石館，都擁有豐富的岩牆角度、高頻率更換攀爬路線，更有高品質的舒適環境與完善設備。</p>

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

<h2>各分店詳細介紹</h2>

<h3>中和店（上攀）</h3>
<ul>
<li><strong>地址</strong>：新北市中和區立言街 41 號</li>
<li><strong>營業時間</strong>：
  <ul>
  <li>週一至週五 12:00-23:00</li>
  <li>週六、週日 9:00-22:00</li>
  </ul>
</li>
<li><strong>特色</strong>：設有自動確保器，一個人也可以享受上攀樂趣</li>
</ul>

<h3>明德店（抱石）</h3>
<ul>
<li><strong>地址</strong>：台北市北投區文林北路 222 號 B1</li>
<li><strong>營業時間</strong>：
  <ul>
  <li>週一至週五 12:00-23:00</li>
  <li>週六至週日 10:00-22:00</li>
  </ul>
</li>
<li><strong>票價</strong>：
  <ul>
  <li>平日全日票 $500</li>
  <li>下午 12:00-18:00 $350</li>
  <li>晚上 17:00-23:00 $450</li>
  <li>星光 20:30-23:00 $320</li>
  <li>假日全日票 $550</li>
  <li>假日星光 19:30-22:00 $320</li>
  <li>岩鞋租借 $100</li>
  </ul>
</li>
</ul>

<h3>萬華店（抱石）</h3>
<ul>
<li><strong>特色</strong>：空間寬敞，除了一般攀登牆面，還有 training wall、兒童攀岩、熱身收操區、瑜珈教室等</li>
<li><strong>路線</strong>：岩面角度變化多、岩點約每兩周更換，路線從 VB 到 V8 都有</li>
</ul>

<h2>攀岩體驗項目</h2>

<h3>上攀體驗</h3>
<ul>
<li>高度約 8-10 公尺</li>
<li>通常須兩人為伴</li>
<li>中和店、新店店、A19 店設有自動確保器，一人也可攀爬</li>
</ul>

<h3>抱石體驗</h3>
<ul>
<li>牆面高度 3-4 公尺</li>
<li>地板鋪設厚軟墊確保安全</li>
<li>獨自一人也可以攀爬</li>
</ul>

<h2>課程與活動</h2>

<h3>教學課程</h3>
<ul>
<li>抱石教學</li>
<li>兒童及青少年教學</li>
<li>系統化攀岩訓練</li>
<li>初階、進階確保課程</li>
</ul>

<h3>冬令營</h3>
<p>2026 年原岩攀岩冬令營已開放報名，適合學齡兒童參加。</p>

<h2>新手建議</h2>
<p>如果是第一次攀岩，建議預約體驗課程，會有教練指導基本攀爬技巧！課程包含：</p>
<ul>
<li>基本安全知識</li>
<li>攀爬技巧教學</li>
<li>墜落保護動作</li>
<li>實際攀爬練習</li>
</ul>

<h2>結語</h2>
<p>原岩攀岩館是新手入門的絕佳選擇，環境舒適、設備完善、路線豐富。不管你是想運動健身、挑戰自我，還是單純體驗攀岩的樂趣，都能在這裡找到適合你的路線。</p>',
  'gyms',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_gyms_001', '岩館');
INSERT INTO post_tags (post_id, tag) VALUES ('post_gyms_001', '原岩');
INSERT INTO post_tags (post_id, tag) VALUES ('post_gyms_001', '抱石');

-- 9. 攀岩旅遊 (travel)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_travel_001',
  '996bf611399e5ee8594a478909dd4db9',
  '泰國喀比攀岩之旅：Railay 半島攀岩天堂完整攻略',
  'thailand-krabi-railay-rock-climbing-guide',
  '泰國喀比 Railay 半島被譽為攀岩天堂，擁有超過 700 條攀岩路線。本文分享從台灣出發的完整攻略，包含交通、住宿、攀岩課程推薦。',
  '<h2>前言</h2>
<p>如果你在室內岩館練習了一段時間，想要體驗戶外天然岩壁的魅力，泰國喀比的 Railay 半島絕對是最佳選擇之一。這裡是全球攀岩者的朝聖地，壯觀的喀斯特地形與湛藍海水的結合，讓每次攀爬都成為難忘的體驗。</p>

<h2>為什麼選擇喀比？</h2>
<ul>
<li>超過 700 條攀岩路線</li>
<li>難度從入門 5.6 到專家級 5.14b 都有</li>
<li>壯觀的喀斯特地形，岩石型態多樣化</li>
<li>從台灣出發航程約 4 小時</li>
<li>物價親民，性價比高</li>
<li>可結合海島度假行程</li>
</ul>

<h2>地理位置與交通</h2>

<h3>認識 Railay 半島</h3>
<p>大家說的喀比攀岩場，其實指的是 Krabi 的 Railay 萊莉海灘與 Tonsai 海灘。Railay 是一個「半島」，中間有懸崖峭壁，從泰國本島沒辦法陸路過去，一定要搭長尾船（long tail boat）。</p>

<h3>如何抵達</h3>
<ol>
<li><strong>從台灣出發</strong>：飛往喀比國際機場（約 4 小時）</li>
<li><strong>機場到碼頭</strong>：搭車到 Ao Nang 或喀比鎮碼頭</li>
<li><strong>搭長尾船</strong>：海上航行約 15 分鐘，每人單程 100 泰銖</li>
</ol>

<h3>停靠點差異</h3>
<ul>
<li>從 Ao Nang 出發：停 Railay West</li>
<li>從喀比鎮或 Ao Nam Mao 碼頭：停 Railay East</li>
</ul>

<h2>簽證資訊</h2>
<p>台灣人去泰國可以使用落地簽，到泰國機場再辦即可，可停留 15 天。記得準備：</p>
<ul>
<li>護照（效期 6 個月以上）</li>
<li>證件照一張</li>
<li>2,000 泰銖簽證費</li>
</ul>

<h2>攀岩課程與體驗</h2>

<h3>Top-roping 攀岩</h3>
<p>最適合初學者的方式，安全繩索從上方固定點穿過，墜落距離和力量都較小，非常安全。初學者可挑戰 12 米到 30 米的攀石路線。</p>

<h3>課程預訂</h3>
<p>可透過 KKday 或 Klook 預先預訂，行程已包括在喀比酒店接送，免卻溝通的麻煩。也可以到 Railay 現場找當地的攀岩學校報名。</p>

<h2>最佳旅遊季節</h2>
<p>喀比全年天氣分三季：</p>
<ul>
<li><strong>夏季（2-5月）</strong>：氣溫 34-38 度，較熱</li>
<li><strong>雨季（6-9月）</strong>：多雨，不建議攀岩</li>
<li><strong>冬季（10-12月）</strong>：氣溫 20-30 度，天氣清涼雨少</li>
</ul>
<p>建議避開雨季，其餘季節都非常適合攀岩。</p>

<h2>住宿建議</h2>

<h3>Railay 半島</h3>
<p>住在半島上最方便，早晚都可以爬。價位較高但省去交通時間。</p>

<h3>Tonsai 海灘</h3>
<p>攀岩者聚集的背包客區，氣氛輕鬆，價格較親民。</p>

<h3>Ao Nang</h3>
<p>選擇多、機能好，但每天需搭船往返。</p>

<h2>行程建議</h2>
<p>推薦 5-7 天的行程：</p>
<ul>
<li>Day 1：抵達喀比，前往 Railay</li>
<li>Day 2-3：攀岩課程與練習</li>
<li>Day 4：休息日，可安排跳島或按摩</li>
<li>Day 5-6：繼續攀岩挑戰</li>
<li>Day 7：返回台灣</li>
</ul>

<h2>結語</h2>
<p>泰國喀比的攀岩之旅是每個攀岩愛好者都應該體驗一次的冒險。在這裡，你可以一邊欣賞壯麗的海景，一邊挑戰各種難度的天然岩壁，絕對是畢生難忘的體驗。</p>',
  'travel',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_travel_001', '旅遊');
INSERT INTO post_tags (post_id, tag) VALUES ('post_travel_001', '泰國');
INSERT INTO post_tags (post_id, tag) VALUES ('post_travel_001', '喀比');

-- 10. 賽事介紹 (competition)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_001',
  '996bf611399e5ee8594a478909dd4db9',
  '認識攀岩比賽：從岩館業餘賽到奧運殿堂',
  'understanding-rock-climbing-competitions',
  '攀岩自東京奧運成為正式項目後備受矚目。本文介紹攀岩比賽的種類、規則，以及台灣的攀岩賽事資訊。',
  '<h2>前言</h2>
<p>攀岩在 2020 東京奧運首次成為正式比賽項目，讓這項運動獲得了前所未有的關注。無論你是想參與比賽還是純粹觀賞，了解攀岩比賽的規則與種類都能讓你更享受這項運動。</p>

<h2>攀岩比賽三大項目</h2>

<h3>1. 難度賽（Lead Climbing）</h3>
<ul>
<li><strong>形式</strong>：攀爬 15 公尺以上的高牆</li>
<li><strong>計分</strong>：以攀登的高度計算成績</li>
<li><strong>時間</strong>：通常限時 6 分鐘</li>
<li><strong>特色</strong>：考驗耐力與路線閱讀能力</li>
</ul>

<h3>2. 抱石賽（Bouldering）</h3>
<ul>
<li><strong>形式</strong>：在限時內攀爬多條短路線</li>
<li><strong>計分</strong>：完成路線數與嘗試次數</li>
<li><strong>時間</strong>：每條路線約 4-5 分鐘</li>
<li><strong>特色</strong>：考驗爆發力與解題能力</li>
</ul>

<h3>3. 速度賽（Speed Climbing）</h3>
<ul>
<li><strong>形式</strong>：在標準化的 15 公尺牆面比快</li>
<li><strong>計分</strong>：以秒計算，快者勝</li>
<li><strong>世界紀錄</strong>：男子約 5 秒，女子約 7 秒</li>
<li><strong>特色</strong>：純粹的速度對決</li>
</ul>

<h2>奧運攀岩規則</h2>
<p>巴黎奧運將攀岩分為兩個項目：</p>
<ul>
<li><strong>速度賽</strong>：獨立項目</li>
<li><strong>複合賽</strong>：結合抱石與難度賽</li>
</ul>
<p>這讓不同專長的選手都有機會在奧運舞台上發光。</p>

<h2>台灣攀岩賽事</h2>

<h3>全國性賽事</h3>
<ul>
<li><strong>全國運動會攀岩項目</strong>：四年一度</li>
<li><strong>全國青少年運動攀登錦標賽</strong>：每年舉辦</li>
<li><strong>全國抱石錦標賽</strong>：年度盛事</li>
</ul>

<h3>2025 重要賽事</h3>

<h4>114學年度全國青少年運動攀登錦標賽</h4>
<ul>
<li><strong>主辦</strong>：中華民國山岳協會</li>
<li><strong>規則</strong>：採用 2025 年度 IFSC 最新比賽規則</li>
<li><strong>項目</strong>：個人難度賽</li>
<li><strong>選拔</strong>：優秀選手有機會入選亞洲青少年錦標賽國家代表隊</li>
</ul>

<h4>2025 Max Asia 全國青少年抱石亞洲交流賽</h4>
<ul>
<li><strong>時間</strong>：114 年 8 月 23 日</li>
<li><strong>地點</strong>：風城攀岩館勝利館（新竹縣竹北市）</li>
<li><strong>參賽資格</strong>：9-16 歲青少年，國籍不限</li>
<li><strong>報名費</strong>：會員 1,200 元 / 非會員 1,800 元</li>
</ul>

<h2>岩館業餘賽</h2>
<p>許多攀岩館定期舉辦業餘比賽，是新手參賽的好機會：</p>
<ul>
<li>門檻低，適合各程度參加</li>
<li>氣氛輕鬆，重在參與</li>
<li>可以認識岩友，交流技巧</li>
<li>通常有豐富的獎品</li>
</ul>

<h2>如何開始參賽</h2>
<ol>
<li><strong>穩定練習</strong>：建立基本體能與技術</li>
<li><strong>參加岩館比賽</strong>：累積比賽經驗</li>
<li><strong>加入協會</strong>：取得正式比賽資格</li>
<li><strong>報名賽事</strong>：挑戰自己的極限</li>
</ol>

<h2>結語</h2>
<p>攀岩比賽不只是頂尖選手的舞台，也是每個攀岩者挑戰自我的機會。無論是岩館的趣味賽還是正式的錦標賽，比賽都能讓你更有目標地訓練，結識更多岩友。期待在賽場上看到你！</p>',
  'competition',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_001', '比賽');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_001', '錦標賽');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_001', '奧運');

-- 11. 活動介紹 (events)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_events_001',
  '996bf611399e5ee8594a478909dd4db9',
  '2025 台灣攀岩活動總整理：課程、體驗、工作坊',
  '2025-taiwan-rock-climbing-events-guide',
  '想要學習攀岩或精進技術？本文整理 2025 年台灣各地攀岩館的課程、體驗活動與工作坊資訊。',
  '<h2>前言</h2>
<p>攀岩風氣在台灣日漸盛行，各攀岩館與戶外單位紛紛推出多元的活動。無論你是完全新手還是想要進階學習，都能找到適合的課程與活動。</p>

<h2>新手體驗課程</h2>

<h3>原岩攀岩館體驗課程</h3>
<ul>
<li><strong>內容</strong>：基礎安全知識、攀爬技巧教學、實際攀爬練習</li>
<li><strong>時長</strong>：約 2 小時</li>
<li><strong>適合對象</strong>：完全新手</li>
<li><strong>預約方式</strong>：官網或 FB 私訊</li>
</ul>

<h3>岩究所 double8 體驗</h3>
<ul>
<li><strong>地點</strong>：Y17 館（全台第一個室內攀岩場）</li>
<li><strong>特色</strong>：高達 12 公尺的攀登高度，仿戶外地形豐富</li>
<li><strong>適合對象</strong>：3 歲以上皆可入場</li>
</ul>

<h2>技巧進階課程</h2>

<h3>確保課程</h3>
<ul>
<li><strong>初階確保課程</strong>：學習基本確保技術</li>
<li><strong>進階確保課程</strong>：先鋒確保、多種確保器使用</li>
</ul>

<h3>攀岩技巧課程</h3>
<ul>
<li>腳法訓練</li>
<li>動態動作練習</li>
<li>路線閱讀</li>
<li>心理訓練</li>
</ul>

<h2>兒童與青少年課程</h2>

<h3>原岩攀岩冬令營</h3>
<ul>
<li><strong>時間</strong>：寒假期間</li>
<li><strong>對象</strong>：學齡兒童</li>
<li><strong>內容</strong>：系統化攀岩教學、遊戲互動、團隊合作</li>
<li><strong>報名</strong>：2026 年冬令營已開放報名</li>
</ul>

<h3>幼兒/兒童/成人抱石課程</h3>
<ul>
<li>依年齡分班</li>
<li>小班制教學</li>
<li>漸進式課程設計</li>
</ul>

<h2>戶外攀岩活動</h2>

<h3>GO Formosa 戶外訓練學校</h3>
<ul>
<li><strong>內容</strong>：國內外登山、戶外攀岩、越野跑活動</li>
<li><strong>特色</strong>：透過知識性課程、實務戶外訓練，從零開始走入戶外</li>
</ul>

<h3>龍洞戶外體驗</h3>
<ul>
<li>專業教練帶領</li>
<li>適合有室內攀岩基礎者</li>
<li>提供完整裝備</li>
</ul>

<h2>團體活動</h2>

<h3>企業團建</h3>
<p>攀岩是熱門的團隊建立活動，許多岩館提供企業包場服務：</p>
<ul>
<li>團隊合作訓練</li>
<li>確保夥伴關係建立</li>
<li>挑戰自我、突破恐懼</li>
</ul>

<h3>親子活動</h3>
<ul>
<li>親子同樂攀岩</li>
<li>建立親子互信</li>
<li>適合各年齡層</li>
</ul>

<h2>如何報名</h2>
<p>各活動報名方式：</p>
<ul>
<li><strong>原岩攀岩館</strong>：官網預約或 FB 私訊</li>
<li><strong>岩究所 double8</strong>：Rezio 線上預約</li>
<li><strong>GO Formosa</strong>：官網報名</li>
<li><strong>戶外體驗</strong>：KKday、Klook 平台預訂</li>
</ul>

<h2>結語</h2>
<p>攀岩活動種類多元，無論是想要入門體驗、精進技術，還是帶著小朋友一起運動，都能找到適合的活動。建議關注各攀岩館的 Facebook 粉絲專頁，掌握最新活動資訊。</p>',
  'events',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_events_001', '活動');
INSERT INTO post_tags (post_id, tag) VALUES ('post_events_001', '課程');
INSERT INTO post_tags (post_id, tag) VALUES ('post_events_001', '體驗');

-- 12. 社群資源 (community)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_001',
  '996bf611399e5ee8594a478909dd4db9',
  '台灣攀岩社群指南：協會、粉專、論壇一次掌握',
  'taiwan-rock-climbing-community-guide',
  '想融入台灣攀岩圈？本文整理各大攀岩協會、社群媒體、線上資源，幫助你找到岩友、獲取最新資訊。',
  '<h2>前言</h2>
<p>攀岩是一項需要夥伴的運動，尤其是戶外攀岩更需要可靠的確保者。加入攀岩社群不僅能認識志同道合的朋友，還能獲取最新的活動資訊與技術交流。</p>

<h2>官方協會</h2>

<h3>臺灣戶外攀岩協會（TOCC）</h3>
<ul>
<li><strong>全名</strong>：Taiwan Outdoor Climbers Coalition</li>
<li><strong>專注領域</strong>：戶外攀岩活動，特別是龍洞岩場</li>
<li><strong>主要工作</strong>：
  <ul>
  <li>龍洞岩場資源維護與管理</li>
  <li>路線資料建置與更新</li>
  <li>定期舉辦工作假期</li>
  <li>推動攀岩安全教育</li>
  </ul>
</li>
<li><strong>官網</strong>：tocc-climbing.org</li>
</ul>

<h3>中華民國山岳協會</h3>
<ul>
<li><strong>專注領域</strong>：正式攀岩賽事、國家代表隊培訓</li>
<li><strong>主要工作</strong>：
  <ul>
  <li>主辦全國性攀岩比賽</li>
  <li>選手培訓與選拔</li>
  <li>國際賽事參與</li>
  </ul>
</li>
<li><strong>比賽系統</strong>：ctaa.j91.me</li>
</ul>

<h2>攀岩館社群</h2>

<h3>原岩攀岩館 T-UP Climbing</h3>
<ul>
<li><strong>Facebook</strong>：@tupclimbing</li>
<li><strong>Instagram</strong>：@tupclimbing</li>
<li><strong>內容</strong>：新路線公告、活動資訊、課程報名</li>
</ul>

<h3>岩究所 double8</h3>
<ul>
<li><strong>Facebook</strong>：@double8y17climbing</li>
<li><strong>特色</strong>：結合大稻埕文化的攀爬活動</li>
</ul>

<h2>線上資源</h2>

<h3>台灣攀岩資料庫</h3>
<ul>
<li><strong>網站</strong>：climbing.org</li>
<li><strong>內容</strong>：路線資料、岩場資訊、討論區</li>
</ul>

<h3>健行筆記</h3>
<ul>
<li><strong>內容</strong>：攀岩文章、技術分享、岩場介紹</li>
<li><strong>特色</strong>：結合登山與攀岩資訊</li>
</ul>

<h2>實用 Facebook 社團</h2>
<p>搜尋以下關鍵字可找到活躍的攀岩社團：</p>
<ul>
<li>台灣攀岩</li>
<li>抱石愛好者</li>
<li>龍洞攀岩</li>
<li>各攀岩館專屬社團</li>
</ul>

<h2>戶外攀岩資源</h2>

<h3>FEARLESS-COOL</h3>
<ul>
<li><strong>內容</strong>：台灣戶外極限運動資訊</li>
<li><strong>攀岩相關</strong>：15+ 戶外攀岩場地圖</li>
</ul>

<h3>Seven Summits 七頂峰</h3>
<ul>
<li><strong>內容</strong>：全台攀岩館評比與推薦</li>
<li><strong>特色</strong>：詳細的場館評測</li>
</ul>

<h2>如何融入社群</h2>

<h3>給新手的建議</h3>
<ol>
<li><strong>固定去同一家岩館</strong>：容易認識常客</li>
<li><strong>參加岩館活動</strong>：比賽、課程、聚會</li>
<li><strong>主動打招呼</strong>：攀岩圈氛圍友善</li>
<li><strong>加入線上社團</strong>：獲取活動資訊</li>
<li><strong>參加戶外體驗</strong>：認識更多岩友</li>
</ol>

<h3>找確保夥伴</h3>
<p>想要上攀但缺夥伴？可以：</p>
<ul>
<li>在岩館布告欄留言</li>
<li>在 Facebook 社團發文</li>
<li>參加確保配對活動</li>
</ul>

<h2>結語</h2>
<p>台灣攀岩社群雖然不大，但非常溫暖友善。只要主動踏出第一步，很快就能認識一群熱愛攀岩的朋友。期待在岩場上遇見你！</p>',
  'community',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_community_001', '社群');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_001', '協會');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_001', '資源');

-- 13. 傷害防護 (injury)
INSERT INTO posts (id, author_id, title, slug, excerpt, content, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_injury_001',
  '996bf611399e5ee8594a478909dd4db9',
  '攀岩傷害預防與復健：保護你的手指與關節',
  'rock-climbing-injury-prevention-rehabilitation',
  '攀岩是高強度的手指運動，受傷風險不可忽視。本文介紹常見攀岩傷害的預防方法與復健知識。',
  '<h2>前言</h2>
<p>對於常運動的人，難免會有運動傷害，尤其是攀岩這種大量並且集中使用手部力量的運動。了解常見傷害類型以及復健動作，能讓我們在受傷後更快恢復，或者避免傷害發生。</p>

<h2>攀岩常見傷害</h2>

<h3>手指傷害</h3>
<p>抱石攀岩使力時，手指最容易受傷。常見類型：</p>
<ul>
<li><strong>滑輪韌帶拉傷</strong>：最常見的攀岩傷害</li>
<li><strong>肌腱炎</strong>：過度使用導致發炎</li>
<li><strong>關節扭傷</strong>：錯誤施力或墜落造成</li>
</ul>

<h3>手腕傷害</h3>
<ul>
<li>腕隧道症候群</li>
<li>TFCC 損傷（三角纖維軟骨複合體）</li>
<li>肌腱炎</li>
</ul>

<h3>肩膀傷害</h3>
<ul>
<li>旋轉肌群拉傷</li>
<li>肩關節唇撕裂</li>
</ul>

<h2>傷害預防方法</h2>

<h3>充分熱身</h3>
<p>攀爬前務必做好熱身：</p>
<ul>
<li>全身性有氧運動（5-10 分鐘）</li>
<li>手指關節活動</li>
<li>手腕轉動與伸展</li>
<li>從簡單路線開始暖身</li>
</ul>

<h3>漸進式訓練</h3>
<ul>
<li>不要一開始就挑戰極限難度</li>
<li>讓手指有時間適應強度</li>
<li>循序漸進增加訓練量</li>
</ul>

<h3>注意身體信號</h3>
<ul>
<li>感到疼痛立即停止</li>
<li>區分「累」和「痛」的差異</li>
<li>不要忍痛繼續攀爬</li>
</ul>

<h3>適當休息</h3>
<ul>
<li>攀爬之間給予足夠休息</li>
<li>避免連續多天高強度訓練</li>
<li>每週至少休息 1-2 天</li>
</ul>

<h2>肌腱炎的認識</h2>

<h3>成因</h3>
<p>肌腱是連接肌肉與骨骼的帶狀纖維組織，如果過度使用或施力不當，就可能發生肌腱炎。好發部位包括手指、手腕、手肘、肩膀等。</p>

<h3>症狀</h3>
<ul>
<li>局部疼痛</li>
<li>按壓患處或用力時不適感加劇</li>
<li>可能有腫脹發熱現象</li>
</ul>

<h3>恢復期</h3>
<ul>
<li>輕微者：兩週內可自癒</li>
<li>嚴重者：可能超過一個半月</li>
<li>慢性化：伴隨無力、麻痺、動作僵硬</li>
</ul>

<h2>受傷後處理</h2>

<h3>急性期（受傷後 1 週內）</h3>
<ul>
<li><strong>休息</strong>：停止攀岩活動</li>
<li><strong>冰敷</strong>：每次 15-20 分鐘</li>
<li><strong>固定</strong>：必要時使用護具</li>
<li><strong>避免推拿</strong>：急性期推拿可能加劇症狀</li>
</ul>

<h3>恢復期</h3>
<ul>
<li>物理治療（電療、超音波）</li>
<li>拉筋伸展</li>
<li>循序漸進恢復訓練</li>
</ul>

<h3>進階治療</h3>
<p>若超過三個月仍反覆發作，可考慮：</p>
<ul>
<li>增生療法（Prolotherapy）</li>
<li>PRP 注射</li>
<li>專業復健治療</li>
</ul>

<h2>復健運動建議</h2>

<h3>手指伸展</h3>
<ul>
<li>使用橡皮筋做反向訓練</li>
<li>手指外展運動</li>
<li>握拳後緩慢伸展</li>
</ul>

<h3>手腕活動</h3>
<ul>
<li>手腕轉動（順逆時針）</li>
<li>手腕屈伸</li>
<li>使用彈力球按摩</li>
</ul>

<h2>何時該就醫</h2>
<p>出現以下情況應盡快就醫：</p>
<ul>
<li>劇烈疼痛且持續不退</li>
<li>明顯腫脹或變形</li>
<li>無法正常活動</li>
<li>休息後仍不見好轉</li>
<li>疼痛影響日常生活</li>
</ul>

<h2>結語</h2>
<p>攀岩傷害預防重於治療。養成良好的熱身習慣、循序漸進訓練、聆聽身體的聲音，才能長久享受攀岩的樂趣。如有持續不適，請務必諮詢專業的復健科醫師或物理治療師。</p>',
  'injury',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_injury_001', '傷害');
INSERT INTO post_tags (post_id, tag) VALUES ('post_injury_001', '復健');
INSERT INTO post_tags (post_id, tag) VALUES ('post_injury_001', '預防');
