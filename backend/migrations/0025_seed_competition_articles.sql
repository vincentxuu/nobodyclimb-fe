-- Seed competition blog posts
-- Author: nobodyclimb (staff account)
-- Date: 2026-01-19

-- First, create the nobodyclimb staff user if not exists
INSERT OR IGNORE INTO users (id, email, username, display_name, avatar, password_hash, role, is_active, email_verified, created_at, updated_at)
VALUES (
  'nobodyclimb_staff_account_001',
  'staff@nobodyclimb.cc',
  'nobodyclimb',
  'NobodyClimb',
  '/logo192.png',
  '$2a$10$placeholder_hash_for_staff_account',
  'admin',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 1. IFSC 世界盃攀岩賽事完整介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_ifsc_world_cup',
  'nobodyclimb_staff_account_001',
  'IFSC 世界盃攀岩賽事完整介紹',
  'ifsc-world-cup-complete-guide',
  '國際運動攀登總會（IFSC）主辦的世界盃是攀岩界最高等級的賽事之一。本文完整介紹三大競技項目、2025-2026 賽季亮點，以及如何觀看賽事直播。',
  '<h2>IFSC 簡介</h2>
<p>國際運動攀登總會（International Federation of Sport Climbing，簡稱 IFSC）成立於 2007 年，是管理全球競技攀岩運動的國際組織。IFSC 負責制定比賽規則、舉辦世界盃與世界錦標賽，並推動攀岩運動進入奧林匹克運動會。</p>
<p>IFSC 世界盃是攀岩界最高等級的巡迴賽事，每年在全球各地舉辦多站比賽，吸引世界頂尖選手參與。透過世界盃，選手可以累積積分，爭取年度總冠軍以及奧運參賽資格。</p>

<h2>三大競技項目</h2>

<h3>1. 先鋒攀登（Lead Climbing）</h3>
<p>先鋒攀登是最傳統的攀岩比賽項目，考驗選手的耐力、技術與路線閱讀能力：</p>
<ul>
<li><strong>岩壁高度</strong>：12 公尺以上</li>
<li><strong>路線長度</strong>：至少 15 公尺</li>
<li><strong>比賽時間</strong>：限時 6 分鐘完成</li>
<li><strong>計分方式</strong>：以攀登高度計分，越高分數越高</li>
<li><strong>特色</strong>：選手需要邊爬邊將繩索扣入快扣，考驗體力分配與心理素質</li>
</ul>

<h3>2. 抱石（Bouldering）</h3>
<p>抱石是近年最受歡迎的攀岩項目，強調爆發力與解題能力：</p>
<ul>
<li><strong>岩壁高度</strong>：4-5 公尺</li>
<li><strong>路線數量</strong>：每場至少 4 條路線（問題）</li>
<li><strong>計分方式</strong>：計算完攀數（Top）與嘗試次數，完攀越多、嘗試越少越好</li>
<li><strong>安全措施</strong>：無繩索確保，地面鋪設厚軟墊保護</li>
<li><strong>特色</strong>：每條路線都是獨特的「問題」，需要選手現場解讀最佳攀爬方式</li>
</ul>

<h3>3. 速度攀岩（Speed Climbing）</h3>
<p>速度攀岩是最純粹的競速項目，追求極致的爆發力：</p>
<ul>
<li><strong>岩壁高度</strong>：標準化 15 公尺</li>
<li><strong>路線設計</strong>：全球統一的固定路線（自 2007 年制定）</li>
<li><strong>比賽方式</strong>：兩人對戰淘汰制</li>
<li><strong>世界紀錄</strong>：男子 4.64 秒（Sam Watson，美國）、女子 6.06 秒（Aleksandra Miroslaw，波蘭）</li>
<li><strong>特色</strong>：由於路線固定，選手可以透過反覆練習達到肌肉記憶的極致</li>
</ul>

<h2>2025 賽季亮點</h2>
<p>2025 年 IFSC 世界盃賽季帶來多項突破性的新站點：</p>
<ul>
<li><strong>首次南美洲站</strong>：巴西庫里奇巴（Curitiba）成為世界盃史上第一個南美洲站點</li>
<li><strong>首次峇里島站</strong>：印尼峇里島加入世界盃巡迴賽</li>
<li><strong>首次丹佛站</strong>：美國科羅拉多州丹佛首度舉辦世界盃</li>
<li><strong>首次克拉科夫站</strong>：波蘭克拉科夫新增為比賽站點</li>
</ul>
<p>這些新站點的加入，讓世界盃更加全球化，也為更多地區的攀岩愛好者提供近距離觀賞頂尖賽事的機會。</p>

<h2>2026 賽季預告</h2>
<p>IFSC 已公布 2026 年世界盃賽程，將有更多令人期待的新元素：</p>
<ul>
<li><strong>賽事規模</strong>：11 個國家、13 站賽事</li>
<li><strong>重大創新</strong>：四車道速度賽首次亮相，讓速度攀岩更具觀賞性</li>
<li><strong>新增站點</strong>：美國鹽湖城、韓國首爾等城市加入</li>
<li><strong>歐洲重鎮</strong>：瑞士維拉爾、奧地利因斯布魯克等傳統攀岩強國持續舉辦</li>
</ul>

<h2>如何觀看賽事</h2>
<p>想要觀看 IFSC 世界盃賽事，有以下幾種方式：</p>

<h3>IFSC YouTube 頻道</h3>
<p>IFSC 官方 YouTube 頻道提供所有賽事的免費直播與重播，是最方便的觀看方式。頻道上還有精彩片段、選手訪談等內容。</p>

<h3>IFSC 官方網站</h3>
<p>官網（ifsc-climbing.org）提供完整賽程、即時比分、選手排名等資訊。賽事期間也會提供直播連結。</p>

<h3>賽程查詢</h3>
<p>可透過 IFSC 官方行事曆（worldclimbing.com/calendar）查詢各站賽事的詳細時間與地點。由於時差關係，台灣觀眾可能需要在深夜或清晨觀看歐美站點的比賽。</p>

<h2>結語</h2>
<p>IFSC 世界盃是攀岩迷不可錯過的年度盛事。無論你是想學習頂尖選手的技術，還是單純享受比賽的刺激，都能在世界盃中找到樂趣。2025 與 2026 賽季有許多創新與突破，讓我們一起期待攀岩運動更精彩的未來！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.ifsc-climbing.org/" target="_blank" rel="noopener noreferrer">IFSC 官方網站</a></li>
<li><a href="https://www.worldclimbing.com/calendar/index" target="_blank" rel="noopener noreferrer">IFSC 官方行事曆</a></li>
<li><a href="https://en.wikipedia.org/wiki/2025_IFSC_Climbing_World_Cup" target="_blank" rel="noopener noreferrer">2025 IFSC Climbing World Cup - Wikipedia</a></li>
<li><a href="https://www.planetmountain.com/en/news/competitions/ifsc-announces-2026-calendar-sport-climbing-para-climbing.html" target="_blank" rel="noopener noreferrer">IFSC announces 2026 calendar - PlanetMountain</a></li>
<li><a href="https://www.indoorclimbinggym.com/blog/ifsc-world-cup-2026/" target="_blank" rel="noopener noreferrer">2026 IFSC World Cup Schedule - Indoor Climbing Gym</a></li>
<li><a href="https://gripped.com/indoor-climbing/heres-where-the-ifsc-world-cup-is-going-in-2026/" target="_blank" rel="noopener noreferrer">Gripped: Where IFSC World Cup Is Going in 2026</a></li>
</ul>',
  NULL,
  'competition',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_ifsc_world_cup', 'IFSC');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_ifsc_world_cup', '世界盃');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_ifsc_world_cup', '國際賽事');

-- 2. 各國攀岩賽事與協會介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_national_federations',
  'nobodyclimb_staff_account_001',
  '各國攀岩賽事與協會介紹',
  'national-climbing-federations-guide',
  '想了解國際攀岩生態？本文介紹北美、歐洲、亞洲、大洋洲的主要攀岩協會與賽事系統，以及如何參與國際賽事的指南。',
  '<h2>前言</h2>
<p>攀岩運動在全球蓬勃發展，各國都有自己的攀岩協會負責推廣運動、培育選手、舉辦國內賽事。了解各國攀岩生態，不僅能拓展視野，也能幫助有志參與國際賽事的選手找到正確的管道。</p>

<h2>北美洲</h2>

<h3>美國 - USA Climbing</h3>
<p>美國是攀岩運動的重要推手，USA Climbing 是美國官方的攀岩協會：</p>
<ul>
<li><strong>官網</strong>：usaclimbing.org</li>
<li><strong>國內賽事系統</strong>：分為 Youth（青少年）、Collegiate（大學）、Open（公開）三大系列</li>
<li><strong>重要消息</strong>：2026 年美國將舉辦國內世界盃站點，地點在鹽湖城</li>
<li><strong>特色</strong>：完善的青訓系統，培育出多位世界級選手</li>
</ul>

<h3>加拿大 - Climbing Escalade Canada</h3>
<p>加拿大攀岩協會負責推動國內攀岩運動發展：</p>
<ul>
<li>舉辦國內錦標賽</li>
<li>青年培訓計畫</li>
<li>代表加拿大參與國際賽事</li>
</ul>

<h2>歐洲</h2>

<h3>法國 - FFME</h3>
<p>法國是歐洲攀岩強國，擁有深厚的攀岩傳統：</p>
<ul>
<li>楓丹白露（Fontainebleau）是世界知名的抱石聖地</li>
<li>FFME（Fédération Française de la Montagne et de l''Escalade）負責管理攀岩與登山運動</li>
<li>培育出多位世界冠軍選手</li>
</ul>

<h3>奧地利</h3>
<p>奧地利是攀岩世界盃的常客：</p>
<ul>
<li>因斯布魯克（Innsbruck）是歐洲攀岩重鎮</li>
<li>多次舉辦世界盃與世界錦標賽</li>
<li>擁有世界級的攀岩設施</li>
</ul>

<h3>捷克</h3>
<p>捷克是攀岩傳奇 Adam Ondra 的故鄉：</p>
<ul>
<li>Adam Ondra 被譽為史上最偉大的攀岩者之一</li>
<li>國內賽事發展完善</li>
<li>戶外攀岩資源豐富</li>
</ul>

<h3>斯洛維尼亞</h3>
<p>這個小國在攀岩界有著驚人的成就：</p>
<ul>
<li>Janja Garnbret 的故鄉，她是史上最成功的女子攀岩選手</li>
<li>人口僅 200 多萬，卻擁有世界級的攀岩實力</li>
<li>完善的國家培訓體系</li>
</ul>

<h2>亞洲</h2>

<h3>日本 - JMSCA</h3>
<p>日本是亞洲攀岩強國，在國際賽場上表現優異：</p>
<ul>
<li>JMSCA（Japan Mountaineering and Sport Climbing Association）負責管理攀岩運動</li>
<li>完整的青訓系統，從小學開始培養選手</li>
<li>多位世界級選手：野口啟代、野中生萌、楢﨑智亞等</li>
<li>2020 東京奧運主辦國，推動攀岩成為正式項目</li>
</ul>

<h3>韓國 - KAF</h3>
<p>韓國在攀岩領域持續進步：</p>
<ul>
<li>KAF（Korea Alpine Federation）管理國內攀岩賽事</li>
<li>速度攀岩是強項之一</li>
<li>釜山攀岩中心設施完善</li>
<li>2025 年將舉辦 IFSC 世界錦標賽</li>
</ul>

<h3>中國 - CMA</h3>
<p>中國在速度攀岩領域具有傳統優勢：</p>
<ul>
<li>CMA（Chinese Mountaineering Association）負責攀岩運動</li>
<li>速度攀岩曾多次打破世界紀錄</li>
<li>國家隊培訓體系完善，集中訓練資源</li>
<li>鍾齊鑫等選手在國際賽場表現出色</li>
</ul>

<h3>台灣 - CTAA</h3>
<p>中華民國山岳協會是台灣攀岩運動的官方組織：</p>
<ul>
<li>負責舉辦國內攀岩錦標賽</li>
<li>選拔國家代表隊參與國際賽事</li>
<li>青年選手培育計畫</li>
<li>比賽系統網站：ctaa.j91.me</li>
</ul>

<h2>大洋洲</h2>

<h3>澳洲 - Sport Climbing Australia</h3>
<p>澳洲擁有豐富的戶外攀岩資源：</p>
<ul>
<li>國內賽事聯盟運作成熟</li>
<li>戶外攀岩傳統悠久</li>
<li>藍山（Blue Mountains）等地是知名的攀岩勝地</li>
</ul>

<h2>如何參與國際賽事</h2>

<h3>IFSC 積分系統</h3>
<p>參與國際賽事需要透過 IFSC 積分系統：</p>
<ul>
<li>選手需先在國內賽事累積成績</li>
<li>透過國家協會報名參加國際賽事</li>
<li>在世界盃等賽事中累積積分</li>
<li>積分決定選手的世界排名</li>
</ul>

<h3>國家隊選拔機制</h3>
<p>想代表台灣參加國際賽事，通常需要：</p>
<ol>
<li>成為中華民國山岳協會會員</li>
<li>參加國內錦標賽取得優異成績</li>
<li>通過國家隊選拔</li>
<li>接受培訓並代表國家出賽</li>
</ol>

<h3>業餘愛好者觀賽指南</h3>
<p>即使不是職業選手，也能享受國際賽事：</p>
<ul>
<li>透過 IFSC YouTube 觀看直播</li>
<li>規劃旅行觀看現場比賽</li>
<li>關注選手社群媒體了解最新動態</li>
</ul>

<h2>結語</h2>
<p>了解各國攀岩協會與賽事系統，能幫助我們更深入認識這項運動的國際生態。無論你是想參與比賽的選手，還是熱愛攀岩的愛好者，都能從中找到連結國際攀岩社群的方式。</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://usaclimbing.org/" target="_blank" rel="noopener noreferrer">USA Climbing 官網</a></li>
<li><a href="https://usaclimbing.org/domestic-world-cup-events/" target="_blank" rel="noopener noreferrer">USA Climbing - 2026 Domestic World Cups</a></li>
<li><a href="https://www.tpenoc.net/sport/sports-climbing/" target="_blank" rel="noopener noreferrer">中華奧林匹克委員會 - 運動攀登</a></li>
<li><a href="https://www.ifsc-climbing.org/about/member-federations" target="_blank" rel="noopener noreferrer">IFSC Member Federations</a></li>
</ul>',
  NULL,
  'competition',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_national_federations', '協會');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_national_federations', '國際賽事');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_national_federations', '攀岩組織');

-- 3. 奧運攀岩項目完整解析
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_olympic_climbing',
  'nobodyclimb_staff_account_001',
  '奧運攀岩項目完整解析',
  'olympic-climbing-complete-guide',
  '攀岩自東京奧運成為正式項目後備受矚目。本文詳細介紹攀岩進入奧運的歷程、東京與巴黎的賽制差異、各項目規則，以及台灣選手的奧運之路。',
  '<h2>攀岩進入奧運歷程</h2>
<p>攀岩運動進入奧林匹克運動會是歷史性的里程碑：</p>
<ul>
<li><strong>2016 年</strong>：國際奧委會（IOC）正式宣布將攀岩納入 2020 東京奧運</li>
<li><strong>2021 年</strong>：因疫情延期一年後，攀岩首次在奧運亮相</li>
<li><strong>意義</strong>：這是攀岩運動史上最重要的時刻，讓更多人認識這項運動</li>
</ul>

<h2>東京 2020 賽制</h2>
<p>東京奧運採用三項全能制，引發了不少討論：</p>

<h3>賽制說明</h3>
<ul>
<li><strong>項目組合</strong>：先鋒、抱石、速度三項合一</li>
<li><strong>計分方式</strong>：三項排名相乘，數字越小越好</li>
<li><strong>例如</strong>：若選手三項分別為第 1、2、3 名，總分為 1×2×3=6</li>
</ul>

<h3>賽制爭議</h3>
<p>三項全能制引發了專項選手的困境：</p>
<ul>
<li>先鋒/抱石選手通常不擅長速度攀岩</li>
<li>速度選手則在技術項目表現較弱</li>
<li>這種設計對全能型選手有利，但可能埋沒專項高手</li>
</ul>

<h3>金牌得主</h3>
<ul>
<li><strong>男子</strong>：Alberto Ginés López（西班牙）</li>
<li><strong>女子</strong>：Janja Garnbret（斯洛維尼亞）</li>
</ul>

<h2>巴黎 2024 賽制改革</h2>
<p>巴黎奧運對攀岩賽制進行了重大改革：</p>

<h3>項目分離</h3>
<ul>
<li><strong>速度攀岩</strong>：成為獨立項目，讓速度選手能專注發揮</li>
<li><strong>複合賽</strong>：結合抱石與先鋒攀登，計算兩項綜合成績</li>
</ul>

<h3>改革優點</h3>
<ul>
<li>獎牌數增加：從 2 面增加到 4 面（男女各 2 項）</li>
<li>選手更能發揮專長</li>
<li>比賽更具可看性</li>
</ul>

<h2>洛杉磯 2028 展望</h2>
<p>洛杉磯奧運的攀岩項目令人期待：</p>
<ul>
<li><strong>賽制</strong>：預期維持巴黎賽制（速度獨立 + 複合賽）</li>
<li><strong>場館</strong>：規劃中，可能利用現有設施或新建場館</li>
<li><strong>美國主場優勢</strong>：美國攀岩選手近年崛起，主場作戰備受期待</li>
</ul>

<h2>比賽規則詳解</h2>

<h3>先鋒攀登規則</h3>
<ul>
<li><strong>時間限制</strong>：6 分鐘</li>
<li><strong>岩壁高度</strong>：12 公尺以上</li>
<li><strong>計分方式</strong>：以最高點計分</li>
<li><strong>特殊規定</strong>：
  <ul>
  <li>選手必須依序將繩索扣入快扣</li>
  <li>跳過快扣會被判違規</li>
  <li>墜落後比賽結束</li>
  </ul>
</li>
</ul>

<h3>抱石規則</h3>
<ul>
<li><strong>路線數</strong>：決賽通常為 4-5 條問題</li>
<li><strong>計分點</strong>：
  <ul>
  <li>Zone 點：中繼點，觸碰即得分</li>
  <li>Top 點：終點，需穩定控制</li>
  </ul>
</li>
<li><strong>排名決定</strong>：先比 Top 數，再比 Zone 數，最後比嘗試次數</li>
<li><strong>時間限制</strong>：每條路線約 4-5 分鐘</li>
</ul>

<h3>速度攀岩規則</h3>
<ul>
<li><strong>標準牆面</strong>：15 公尺高、5 度傾斜</li>
<li><strong>比賽方式</strong>：淘汰賽制，兩人同時攀爬對決</li>
<li><strong>搶跑判罰</strong>：起跑反應時間在 0.1 秒內為搶跑，首次警告，二次失格</li>
<li><strong>勝負判定</strong>：先觸頂者獲勝</li>
</ul>

<h2>台灣選手奧運之路</h2>

<h3>選拔機制</h3>
<p>台灣選手要參加奧運，需要經過以下途徑：</p>
<ol>
<li>在世界盃等國際賽事累積積分</li>
<li>參加奧運資格賽</li>
<li>達到參賽標準或取得配額</li>
<li>通過中華奧會審核</li>
</ol>

<h3>挑戰與機會</h3>
<p>台灣攀岩選手面臨的挑戰：</p>
<ul>
<li>國際賽事經驗相對較少</li>
<li>訓練資源與環境有待提升</li>
<li>需要更多國際賽事的磨練</li>
</ul>
<p>但近年台灣攀岩選手持續進步，未來在國際賽場上的表現值得期待。</p>

<h3>未來展望</h3>
<p>台灣攀岩界正在努力：</p>
<ul>
<li>加強青年選手培育</li>
<li>增加國際賽事參與機會</li>
<li>提升訓練設施與資源</li>
<li>推動攀岩運動普及化</li>
</ul>

<h2>結語</h2>
<p>攀岩成為奧運項目，不僅是對這項運動的肯定，也為全球攀岩愛好者帶來了無限的可能性。無論是觀賞比賽還是親身參與，攀岩運動都將因為奧運的舞台而更加精彩。讓我們一起期待台灣選手在未來奧運的表現！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.tpenoc.net/sport/sports-climbing/" target="_blank" rel="noopener noreferrer">中華奧林匹克委員會 - 運動攀登</a></li>
<li><a href="https://olympics.com/en/sports/sport-climbing/" target="_blank" rel="noopener noreferrer">Olympics.com - Sport Climbing</a></li>
<li><a href="https://www.olympics.com/en/news/sport-climbing-world-cup-season-2025-preview" target="_blank" rel="noopener noreferrer">Olympics.com - Sport Climbing World Cup 2025 Preview</a></li>
<li><a href="https://www.olympic.org/sport-climbing" target="_blank" rel="noopener noreferrer">IOC - Sport Climbing</a></li>
</ul>',
  NULL,
  'competition',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_olympic_climbing', '奧運');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_olympic_climbing', '比賽規則');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_olympic_climbing', '國際賽事');

-- 4. 速度攀岩世界紀錄史
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_speed_climbing_records',
  'nobodyclimb_staff_account_001',
  '速度攀岩世界紀錄史',
  'speed-climbing-world-records-history',
  '速度攀岩是攀岩界最純粹的競速運動。本文記錄男女世界紀錄的演進歷程、各國強權分析、技術解密，以及人體極限的探討。',
  '<h2>速度攀岩簡介</h2>
<p>速度攀岩（Speed Climbing）是攀岩三大競技項目中最獨特的一項：</p>
<ul>
<li><strong>標準化岩壁</strong>：15 公尺高、5 度傾斜角</li>
<li><strong>固定路線</strong>：自 2007 年起，全球使用統一路線設計</li>
<li><strong>比賽本質</strong>：最純粹的競速運動，誰先碰到頂端的計時器誰就贏</li>
</ul>
<p>由於路線完全固定，選手可以透過數千次的反覆練習，將每一個動作都刻入肌肉記憶，追求分秒必爭的極致表現。</p>

<h2>現行世界紀錄</h2>

<h3>男子紀錄</h3>
<ul>
<li><strong>紀錄保持人</strong>：Sam Watson（美國）</li>
<li><strong>成績</strong>：4.64 秒</li>
<li><strong>創下時間</strong>：2025 年 5 月（峇里島世界盃）</li>
<li><strong>歷史意義</strong>：首位突破 4.7 秒的選手，將人類極限再次推進</li>
</ul>

<h3>女子紀錄</h3>
<ul>
<li><strong>紀錄保持人</strong>：Aleksandra Miroslaw（波蘭）</li>
<li><strong>成績</strong>：6.06 秒</li>
<li><strong>特點</strong>：連續多次打破自己保持的紀錄</li>
<li><strong>地位</strong>：被譽為女子速度攀岩的統治者</li>
</ul>

<h2>紀錄演進史</h2>

<h3>男子紀錄演進</h3>
<table>
<tr><th>年份</th><th>選手</th><th>國籍</th><th>成績</th></tr>
<tr><td>2017</td><td>Reza Alipourshenazandifar</td><td>伊朗</td><td>5.48 秒</td></tr>
<tr><td>2022</td><td>Kiromal Katibin</td><td>印尼</td><td>5.00 秒</td></tr>
<tr><td>2023</td><td>Veddriq Leonardo</td><td>印尼</td><td>4.90 秒</td></tr>
<tr><td>2024</td><td>Sam Watson</td><td>美國</td><td>4.74 秒</td></tr>
<tr><td>2025</td><td>Sam Watson</td><td>美國</td><td>4.64 秒</td></tr>
</table>
<p>從 2017 年的 5.48 秒到 2025 年的 4.64 秒，男子紀錄在短短幾年內進步了將近一秒，這在競速運動中是相當驚人的進步幅度。</p>

<h3>女子紀錄演進</h3>
<table>
<tr><th>年份</th><th>選手</th><th>國籍</th><th>成績</th></tr>
<tr><td>2021</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.84 秒</td></tr>
<tr><td>2022</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.53 秒</td></tr>
<tr><td>2023</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.24 秒</td></tr>
<tr><td>2024</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.06 秒</td></tr>
</table>
<p>Aleksandra Miroslaw 獨自統治女子速度攀岩界，連續多年打破自己的紀錄，展現出絕對的統治力。</p>

<h2>速度攀岩強國</h2>

<h3>印尼：男子傳統強國</h3>
<p>印尼在男子速度攀岩領域有著輝煌的歷史：</p>
<ul>
<li>Veddriq Leonardo、Kiromal Katibin 等選手多次打破世界紀錄</li>
<li>國家培訓體系完善</li>
<li>速度攀岩在印尼是重點發展項目</li>
</ul>

<h3>波蘭：女子統治地位</h3>
<p>Aleksandra Miroslaw 讓波蘭在女子速度攀岩界佔有一席之地：</p>
<ul>
<li>幾乎壟斷近年所有重大賽事冠軍</li>
<li>世界紀錄的唯一保持者</li>
<li>技術與爆發力的完美結合</li>
</ul>

<h3>中國：完整培訓體系</h3>
<p>中國在速度攀岩有著悠久的傳統：</p>
<ul>
<li>國家隊集中訓練模式</li>
<li>鍾齊鑫等選手曾長期保持世界紀錄</li>
<li>培訓系統持續輸出優秀選手</li>
</ul>

<h3>美國：新興勢力</h3>
<p>美國近年在速度攀岩崛起：</p>
<ul>
<li>Sam Watson 打破男子世界紀錄，成為新一代速度王者</li>
<li>更多年輕選手投入速度攀岩訓練</li>
<li>展現美國攀岩的多元發展</li>
</ul>

<h2>技術分析</h2>
<p>速度攀岩的快雖然看似簡單，但背後有著複雜的技術要素：</p>

<h3>起跑反應時間</h3>
<ul>
<li>比賽採用電子感應起跑系統</li>
<li>反應時間在 0.1 秒以內會被判定為搶跑</li>
<li>頂尖選手的反應時間約在 0.12-0.15 秒之間</li>
</ul>

<h3>爆發力訓練</h3>
<ul>
<li>短跑衝刺能力是基礎</li>
<li>腿部推蹬力量決定速度</li>
<li>需要同時具備垂直與水平方向的爆發力</li>
</ul>

<h3>路線記憶與肌肉記憶</h3>
<ul>
<li>由於路線固定，選手需要將每個動作都練到自動化</li>
<li>透過數千次的重複練習形成肌肉記憶</li>
<li>比賽時幾乎不需要思考，完全靠本能反應</li>
</ul>

<h3>心理素質</h3>
<ul>
<li>面對面的對決帶來極大心理壓力</li>
<li>一次失誤可能就輸掉比賽</li>
<li>需要極強的抗壓能力與專注力</li>
</ul>

<h2>未來展望</h2>

<h3>能否突破 4.5 秒？</h3>
<p>這是攀岩界熱議的話題：</p>
<ul>
<li>Sam Watson 的 4.64 秒已經接近人體極限</li>
<li>但攀岩技術與訓練方法持續進步</li>
<li>許多人相信 4.5 秒大關終將被突破</li>
</ul>

<h3>人體極限探討</h3>
<ul>
<li>速度攀岩結合了短跑與攀爬兩種運動形式</li>
<li>人體的反應時間、肌肉收縮速度都有物理極限</li>
<li>但歷史告訴我們，紀錄總是會被打破</li>
</ul>

<h3>訓練科學進步</h3>
<ul>
<li>運動科學的發展帶來更精準的訓練方法</li>
<li>數據分析幫助選手找出可以改進的細節</li>
<li>營養學與恢復技術的進步讓選手能承受更高強度訓練</li>
</ul>

<h2>結語</h2>
<p>速度攀岩是攀岩運動中最容易理解、最具觀賞性的項目。看著選手在 15 公尺的岩壁上飛速攀爬，在短短幾秒內完成比賽，那種純粹的速度與力量之美，總是讓人熱血沸騰。期待未來有更多選手挑戰人類的極限，為我們帶來更精彩的比賽！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.ifsc-climbing.org/index.php/world-competition/speed-records" target="_blank" rel="noopener noreferrer">IFSC - Speed Climbing Records</a></li>
<li><a href="https://www.climbing.com/news/14-climbing-records-2025/" target="_blank" rel="noopener noreferrer">Climbing.com - 14 Climbers Who Broke Historic Records in 2025</a></li>
<li><a href="https://mrclimb.com/sam-watson-breaks-speed-climbing-record/" target="_blank" rel="noopener noreferrer">Mr Climb - Sam Watson breaks speed climbing record</a></li>
<li><a href="https://en.wikipedia.org/wiki/Speed_climbing" target="_blank" rel="noopener noreferrer">Wikipedia - Speed Climbing World Records</a></li>
</ul>',
  NULL,
  'competition',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_speed_climbing_records', '速度攀岩');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_speed_climbing_records', '世界紀錄');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_speed_climbing_records', '選手');
