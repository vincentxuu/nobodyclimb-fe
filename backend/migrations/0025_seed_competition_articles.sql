-- Seed competition blog posts
-- Author: nobodyclimb (staff account)
-- Date: 2026-01-19

-- Clean up existing posts with these IDs (if any) to avoid conflicts
DELETE FROM post_tags WHERE post_id IN (
  'post_competition_ifsc_world_cup',
  'post_competition_national_federations',
  'post_competition_olympic_climbing',
  'post_competition_speed_climbing_records',
  'post_competition_lead_climbing',
  'post_competition_bouldering'
);

DELETE FROM posts WHERE id IN (
  'post_competition_ifsc_world_cup',
  'post_competition_national_federations',
  'post_competition_olympic_climbing',
  'post_competition_speed_climbing_records',
  'post_competition_lead_climbing',
  'post_competition_bouldering'
);

-- Create the nobodyclimb staff user if not exists
-- First check if user with this username exists, if not create it
INSERT INTO users (id, email, username, display_name, avatar_url, password_hash, role, is_active, email_verified, created_at, updated_at)
SELECT
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
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'nobodyclimb');

-- 1. IFSC 世界盃攀岩賽事完整介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_ifsc_world_cup',
  (SELECT id FROM users WHERE username = 'nobodyclimb'),
  'IFSC 世界盃攀岩賽事完整介紹',
  'ifsc-world-cup-complete-guide',
  '國際運動攀登總會（IFSC）主辦的世界盃是攀岩界最高等級的賽事之一。本文完整介紹三大競技項目、2025-2026 賽季亮點，以及如何觀看賽事直播。',
  '<h2>IFSC 簡介</h2>
<p>國際運動攀登總會（International Federation of Sport Climbing，簡稱 IFSC）成立於 2007 年，是管理全球競技攀岩運動的國際組織。IFSC 負責制定比賽規則、舉辦世界盃與世界錦標賽，並推動攀岩運動進入奧林匹克運動會。</p>
<p>IFSC 世界盃是攀岩界最高等級的巡迴賽事，每年在全球各地舉辦多站比賽，吸引世界頂尖選手參與。透過世界盃，選手可以累積積分，爭取年度總冠軍以及奧運參賽資格。</p>

<h3>組織架構與會員</h3>
<p>IFSC 總部設於瑞士洛桑，目前擁有超過 90 個會員國家聯盟。組織由執行委員會管理，負責制定競賽規則、認證裁判、管理選手排名系統，並與國際奧委會（IOC）緊密合作。現任主席為 Marco Scolaris（義大利），他自 2022 年起擔任此職務。</p>

<h3>賽事層級</h3>
<p>IFSC 賽事分為多個層級：</p>
<ul>
<li><strong>世界盃（World Cup）</strong>：最高等級巡迴賽，全年多站累積積分</li>
<li><strong>世界錦標賽（World Championships）</strong>：兩年一度的世界冠軍爭奪戰</li>
<li><strong>洲際錦標賽</strong>：歐洲、亞洲、泛美等區域錦標賽</li>
<li><strong>青年世界錦標賽</strong>：培育新生代選手的重要舞台</li>
</ul>

<h2>三大競技項目</h2>

<h3>1. 先鋒攀登（Lead Climbing）</h3>
<p>先鋒攀登是最傳統的攀岩比賽項目，考驗選手的耐力、技術與路線閱讀能力：</p>
<ul>
<li><strong>岩壁高度</strong>：15 公尺以上（世界盃標準）</li>
<li><strong>路線長度</strong>：約 40-50 個手點</li>
<li><strong>比賽時間</strong>：限時 6 分鐘完成</li>
<li><strong>計分方式</strong>：以攀登高度計分，每個手點有編號，「+」表示已控制該點並做出有效移動</li>
<li><strong>特色</strong>：選手需要邊爬邊將繩索扣入快扣，考驗體力分配與心理素質</li>
</ul>
<p>先鋒攀登的比賽流程包含資格賽、準決賽與決賽。選手在比賽前會有 6 分鐘的集體觀察時間，之後進入隔離區等待出場，確保比賽公平性。墜落後即結束該次攀登，以最高點計分。</p>
<p><strong>當今頂尖選手</strong>：Jakob Schubert（奧地利）、Adam Ondra（捷克）、Janja Garnbret（斯洛維尼亞）、Jessica Pilz（奧地利）</p>

<h3>2. 抱石（Bouldering）</h3>
<p>抱石是近年最受歡迎的攀岩項目，強調爆發力與解題能力：</p>
<ul>
<li><strong>岩壁高度</strong>：4-5 公尺</li>
<li><strong>路線數量</strong>：資格賽 5 條、決賽 4 條</li>
<li><strong>計分方式</strong>：2024 新制 - Top 25 分、Zone 10 分，每次嘗試扣 0.1 分</li>
<li><strong>安全措施</strong>：無繩索確保，地面鋪設厚軟墊保護</li>
<li><strong>特色</strong>：每條路線都是獨特的「問題」，需要選手現場解讀最佳攀爬方式</li>
</ul>
<p>抱石比賽的魅力在於選手可能用完全不同的方式解決同一個問題。身高、柔軟度、力量類型的差異，都會影響選手的策略選擇。觀眾可以清楚看到選手的每一個動作與嘗試，戲劇性十足。</p>
<p><strong>當今頂尖選手</strong>：Tomoa Narasaki（日本）、Mejdi Schalck（法國）、Janja Garnbret（斯洛維尼亞）、Oriane Bertone（法國）</p>

<h3>3. 速度攀岩（Speed Climbing）</h3>
<p>速度攀岩是最純粹的競速項目，追求極致的爆發力：</p>
<ul>
<li><strong>岩壁高度</strong>：標準化 15 公尺、5 度傾斜</li>
<li><strong>路線設計</strong>：全球統一的固定路線（自 2007 年制定）</li>
<li><strong>比賽方式</strong>：兩人對戰淘汰制，先觸頂者獲勝</li>
<li><strong>世界紀錄</strong>：男子 4.64 秒（Sam Watson，美國）、女子 6.03 秒（Aleksandra Mirosław，波蘭）</li>
<li><strong>特色</strong>：由於路線固定，選手可以透過數千次反覆練習達到肌肉記憶的極致</li>
</ul>
<p>速度攀岩採用電子計時系統，起跑反應時間在 0.1 秒內為搶跑。選手透過長期練習將每個動作都刻入本能，比賽時幾乎不需要思考。這項運動結合了短跑的爆發力與攀爬的技術，是最容易理解、最具觀賞性的攀岩項目。</p>
<p><strong>當今頂尖選手</strong>：Sam Watson（美國）、Veddriq Leonardo（印尼）、Aleksandra Mirosław（波蘭）、Natalia Kalucka（波蘭）</p>

<h2>世界盃賽事歷史</h2>
<p>IFSC 世界盃的前身可追溯至 1989 年首屆攀岩世界盃，當時僅有先鋒攀登一項。隨著運動發展，抱石（1998 年）與速度攀岩陸續加入。多年來，世界盃逐漸形成固定的傳統站點：</p>
<ul>
<li><strong>因斯布魯克（奧地利）</strong>：歐洲攀岩重鎮，Kletterzentrum Innsbruck 是世界頂級場館</li>
<li><strong>霞慕尼（法國）</strong>：結合阿爾卑斯山壯麗景色的經典站點</li>
<li><strong>維拉爾（瑞士）</strong>：夏季戶外賽事的熱門選擇</li>
<li><strong>八王子（日本）</strong>：亞洲頂級攀岩設施所在地</li>
<li><strong>首爾（韓國）</strong>：近年崛起的亞洲攀岩重鎮</li>
</ul>

<h2>2025 賽季亮點</h2>
<p>2025 年 IFSC 世界盃賽季帶來多項突破性的新站點，標誌著攀岩運動的全球化發展：</p>

<h3>首次南美洲站：巴西庫里奇巴</h3>
<p>2025 年 5 月，庫里奇巴（Curitiba）成為世界盃史上第一個南美洲站點，這是攀岩運動發展的重要里程碑。比賽在 Parque Olímpico do Cajuru 舉行，吸引了 23 個國家 115 名選手參賽。巴西登山攀岩聯合會（CBME）為此籌備多年，展現南美洲攀岩社群的熱情與實力。</p>

<h3>首次峇里島站</h3>
<p>印尼峇里島加入世界盃巡迴賽，這對印尼速度攀岩選手意義重大。身為男子速度攀岩強國，印尼選手能在主場迎戰世界好手，Sam Watson 也正是在此站刷新了男子世界紀錄（4.64 秒）。</p>

<h3>其他新站點</h3>
<ul>
<li><strong>丹佛（美國）</strong>：科羅拉多州首度舉辦世界盃，美國攀岩市場持續擴大</li>
<li><strong>克拉科夫（波蘭）</strong>：睽違 16 年再度舉辦世界盃，波蘭速度攀岩女王 Mirosław 的主場</li>
</ul>

<h2>2026 賽季預告</h2>
<p>IFSC 已公布 2026 年世界盃賽程，將有更多令人期待的新元素：</p>
<ul>
<li><strong>賽事規模</strong>：11 個國家、13 站賽事，涵蓋歐洲、亞洲、美洲、大洋洲</li>
<li><strong>重大創新</strong>：四車道速度賽首次亮相，讓速度攀岩更具觀賞性與刺激感</li>
<li><strong>新增站點</strong>：美國鹽湖城、韓國首爾等城市加入</li>
<li><strong>歐洲重鎮</strong>：瑞士維拉爾、奧地利因斯布魯克等傳統攀岩強國持續舉辦</li>
<li><strong>身障攀岩</strong>：Para Climbing 世界盃同步舉辦，推動運動平權</li>
</ul>

<h2>如何觀看賽事</h2>
<p>想要觀看 IFSC 世界盃賽事，有以下幾種方式：</p>

<h3>IFSC YouTube 頻道</h3>
<p>IFSC 官方 YouTube 頻道提供所有賽事的免費直播與重播，是最方便的觀看方式。頻道上還有精彩片段、選手訪談、技術分析等內容。訂閱頻道並開啟通知，就不會錯過任何精彩比賽。</p>

<h3>IFSC 官方網站與 App</h3>
<p>官網（ifsc-climbing.org）提供完整賽程、即時比分、選手排名等資訊。賽事期間也會提供直播連結。IFSC 官方 App 可查詢選手資料、比賽結果與排名變化。</p>

<h3>賽程查詢與時差提醒</h3>
<p>可透過 IFSC 官方行事曆（worldclimbing.com/calendar）查詢各站賽事的詳細時間與地點。由於時差關係，台灣觀眾觀看歐美站點時可能需要調整作息：</p>
<ul>
<li><strong>歐洲站點</strong>：通常在台灣時間深夜至凌晨</li>
<li><strong>美洲站點</strong>：通常在台灣時間清晨</li>
<li><strong>亞洲站點</strong>：時差較小，較容易收看</li>
</ul>

<h3>觀賽小技巧</h3>
<ul>
<li>先鋒賽觀察選手的休息點選擇與體力分配</li>
<li>抱石賽注意不同選手的解法差異，感受「解題」的樂趣</li>
<li>速度賽享受純粹的競速刺激，注意起跑反應與中段加速</li>
</ul>

<h2>結語</h2>
<p>IFSC 世界盃是攀岩迷不可錯過的年度盛事。無論你是想學習頂尖選手的技術，還是單純享受比賽的刺激，都能在世界盃中找到樂趣。2025 與 2026 賽季有許多創新與突破，新站點的加入讓攀岩運動更加全球化。讓我們一起期待攀岩運動更精彩的未來！</p>

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
  (SELECT id FROM users WHERE username = 'nobodyclimb'),
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
<li><strong>國內賽事系統</strong>：
  <ul>
  <li><strong>Youth Series</strong>：青少年賽事，分為地區賽、分區賽、全國賽</li>
  <li><strong>Collegiate Series</strong>：大學生攀岩聯賽</li>
  <li><strong>Open Nationals</strong>：成人公開賽全國錦標賽</li>
  <li><strong>Adaptive Nationals</strong>：身障者攀岩全國賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：2026 年鹽湖城將舉辦 IFSC 世界盃</li>
<li><strong>特色</strong>：完善的青訓系統，培育出 Colin Duffy、Brooke Raboutou、Sam Watson 等世界級選手</li>
</ul>

<h3>加拿大 - Climbing Escalade Canada</h3>
<p>加拿大攀岩協會負責推動國內攀岩運動發展：</p>
<ul>
<li><strong>官網</strong>：climbingcanada.ca</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Canadian Bouldering Championships</strong>：全國抱石錦標賽</li>
  <li><strong>Canadian Lead/Speed Championships</strong>：全國先鋒與速度錦標賽</li>
  <li><strong>Youth Nationals</strong>：青少年全國賽</li>
  </ul>
</li>
<li><strong>地區賽事</strong>：各省設有攀岩協會，舉辦省級錦標賽</li>
<li><strong>國際表現</strong>：Alannah Yip 等選手在國際賽場嶄露頭角</li>
</ul>

<h3>巴西 - CBME</h3>
<p>巴西是南美洲攀岩運動的領頭羊，2025 年創下歷史里程碑：</p>
<ul>
<li><strong>協會</strong>：CBME（Confederação Brasileira de Montanhismo e Escalada）巴西登山攀岩聯合會</li>
<li><strong>歷史性時刻</strong>：2025 年 5 月，庫里奇巴（Curitiba）舉辦南美洲史上首場 IFSC 世界盃</li>
<li><strong>賽事場地</strong>：Parque Olímpico do Cajuru 奧林匹克攀岩訓練中心</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Campeonato Brasileiro</strong>：巴西全國錦標賽</li>
  <li><strong>Copa Brasil</strong>：巴西盃系列賽</li>
  </ul>
</li>
<li><strong>發展歷程</strong>：CBME 會長 Thiago Campacci 表示，這是十年努力推廣攀岩運動的成果</li>
<li><strong>賽事規模</strong>：2025 庫里奇巴世界盃吸引 23 國 115 名選手參賽，巴西與日本各派出 12 名選手</li>
<li><strong>戶外攀岩</strong>：巴西擁有豐富的花崗岩與砂岩攀岩資源</li>
</ul>

<h2>歐洲</h2>

<h3>法國 - FFME</h3>
<p>法國是歐洲攀岩強國，擁有深厚的攀岩傳統：</p>
<ul>
<li><strong>官網</strong>：ffme.fr</li>
<li><strong>協會</strong>：FFME（Fédération Française de la Montagne et de l''Escalade）負責管理攀岩與登山運動</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Championnat de France</strong>：法國全國錦標賽（先鋒、抱石、速度）</li>
  <li><strong>Coupe de France</strong>：法國盃系列賽</li>
  <li><strong>Championnats de France Jeunes</strong>：青少年全國賽</li>
  </ul>
</li>
<li><strong>戶外聖地</strong>：楓丹白露（Fontainebleau）是世界抱石發源地，Céüse、Verdon 等地是先鋒攀岩勝地</li>
<li><strong>知名選手</strong>：Mejdi Schalck、Oriane Bertone 等新生代選手崛起</li>
</ul>

<h3>奧地利 - KVÖ</h3>
<p>奧地利是攀岩世界盃的常客：</p>
<ul>
<li><strong>協會</strong>：KVÖ（Kletterverband Österreich）奧地利攀岩協會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Österreichische Staatsmeisterschaft</strong>：奧地利全國錦標賽</li>
  <li><strong>Austrian Climbing Series</strong>：奧地利攀岩系列賽</li>
  <li><strong>Jugend-Staatsmeisterschaft</strong>：青少年全國賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：因斯布魯克是 IFSC 世界盃與世錦賽的常設舉辦地</li>
<li><strong>知名選手</strong>：Jakob Schubert、Jessica Pilz 等世界冠軍</li>
<li><strong>設施</strong>：Kletterzentrum Innsbruck 是世界頂級的攀岩中心</li>
</ul>

<h3>捷克 - ČHS</h3>
<p>捷克是攀岩傳奇 Adam Ondra 的故鄉，近年積極發展國際賽事：</p>
<ul>
<li><strong>協會</strong>：ČHS（Český horolezecký svaz）捷克登山協會，會長 Jan Bloudek 同時擔任 IFSC 歐洲理事會成員</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Mistrovství České republiky</strong>：捷克全國錦標賽（先鋒、抱石、速度）</li>
  <li><strong>Český pohár</strong>：捷克盃系列賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：
  <ul>
  <li>布拉格（Prague）自 2023 年起連續舉辦 IFSC 世界盃，並確定延續至 2026 與 2028 年</li>
  <li>布爾諾（Brno）將於 2027 年舉辦 IFSC 攀岩與身障攀岩世界錦標賽</li>
  </ul>
</li>
<li><strong>知名選手</strong>：Adam Ondra（史上唯一在同一年贏得先鋒與抱石世錦賽雙冠軍的男選手、4 屆世界冠軍、首位完攀 9c 難度路線 Silence）、Martin Stráník（多屆捷克抱石冠軍）</li>
<li><strong>戶外攀岩</strong>：Adršpach-Teplice 砂岩塔群、Moravský kras 等地是知名攀岩區域</li>
</ul>

<h3>斯洛維尼亞 - PZS</h3>
<p>這個人口僅 200 萬的小國，在攀岩界有著驚人的成就：</p>
<ul>
<li><strong>協會</strong>：PZS（Planinska zveza Slovenije）斯洛維尼亞高山協會，成立於 1893 年，擁有超過 5.8 萬名會員，是斯洛維尼亞最大的運動組織</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Državno prvenstvo</strong>：斯洛維尼亞全國錦標賽</li>
  <li><strong>Slovenski pokal</strong>：斯洛維尼亞盃系列賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：
  <ul>
  <li>科佩爾（Koper）自 2022 年起舉辦 IFSC 世界盃，已確定延續至 2028 年</li>
  <li>2024 年科佩爾站被選手與團隊評為年度最佳世界盃站點</li>
  <li>克拉尼（Kranj）曾連續 25 年舉辦世界盃賽事</li>
  </ul>
</li>
<li><strong>知名選手</strong>：Janja Garnbret（2 屆奧運金牌、8 屆世界冠軍、史上最成功的女子攀岩選手）、Domen Škofic（多屆世界盃獎牌得主）</li>
<li><strong>青訓系統</strong>：Slovenia Climbing Team 從青少年時期開始培養選手，Garnbret 7 歲開始攀岩、13 歲贏得歐洲青少年錦標賽</li>
<li><strong>國家榮譽</strong>：Garnbret 曾獲頒 Bloudek 獎（斯洛維尼亞最高體育榮譽）與金質功績勳章</li>
</ul>

<h3>波蘭 - PZA</h3>
<p>波蘭在女子速度攀岩領域稱霸全球，2025 年迎來重大里程碑：</p>
<ul>
<li><strong>協會</strong>：PZA（Polski Związek Alpinizmu）波蘭登山協會，會長 Marek Wierzbowski</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Mistrzostwa Polski</strong>：波蘭全國錦標賽（先鋒、抱石、速度）</li>
  <li><strong>Puchar Polski</strong>：波蘭盃系列賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：
  <ul>
  <li>克拉科夫（Krakow）於 2025 年 7 月舉辦 IFSC 世界盃，這是波蘭睽違 16 年再度舉辦世界盃</li>
  <li>克拉科夫市長 Aleksander Miszalski 親自出席賽事發布會</li>
  </ul>
</li>
<li><strong>知名選手</strong>：
  <ul>
  <li>Aleksandra Mirosław（2024 奧運金牌、3 屆世界冠軍、世界紀錄保持人 6.03 秒）</li>
  <li>Natalia Kalucka（世界盃獎牌得主、2024 奧運銅牌）</li>
  </ul>
</li>
<li><strong>特色</strong>：國家隊專注於速度攀岩培訓，Mirosław 同時具有波蘭軍人身份</li>
<li><strong>榮譽</strong>：Mirosław 入圍 2025 年勞倫斯世界體育獎年度最佳極限運動員</li>
</ul>

<h3>英國 - BMC</h3>
<p>英國擁有悠久的登山與攀岩傳統，近年競技實力大幅提升：</p>
<ul>
<li><strong>協會</strong>：BMC（British Mountaineering Council）英國登山理事會，負責管理攀岩運動與 GB Climbing 國家隊</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>British Boulder Championships</strong>：英國抱石錦標賽，2025 年於曼徹斯特 Big Depot 舉辦（1 月 25-26 日）</li>
  <li><strong>British Lead Championships</strong>：英國先鋒錦標賽，2025 年於曼徹斯特舉辦（2 月 8-9 日）</li>
  <li><strong>England Climbing Trials</strong>：英格蘭攀岩選拔賽</li>
  </ul>
</li>
<li><strong>知名選手</strong>：
  <ul>
  <li>Toby Roberts（2024 巴黎奧運男子複合賽金牌、2025 布拉格世界盃銅牌）</li>
  <li>Erin McNeice（2025 世界盃先鋒總冠軍）</li>
  <li>Hamish McArthur（奧運選手、多屆全國冠軍）</li>
  </ul>
</li>
<li><strong>青訓系統</strong>：BMC 設有 England National and Regional Squads，2026 年 GB Climbing Performance Programme 持續培育新生代選手</li>
<li><strong>戶外聖地</strong>：峰區（Peak District）、湖區（Lake District）、威爾斯等地是著名的戶外攀岩勝地</li>
</ul>

<h3>西班牙 - FEDME</h3>
<p>西班牙是攀岩運動的熱門目的地，擁有理想的訓練環境：</p>
<ul>
<li><strong>協會</strong>：FEDME（Federación Española de Deportes de Montaña y Escalada）西班牙登山攀岩運動聯合會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Campeonato de España</strong>：西班牙全國錦標賽（先鋒、抱石、速度）</li>
  <li><strong>Copa de España</strong>：西班牙盃系列賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：馬德里（Madrid）於 2025 年舉辦 IFSC 世界盃先鋒賽</li>
<li><strong>知名選手</strong>：
  <ul>
  <li>Alberto Ginés López（2020 東京奧運金牌、史上首位奧運攀岩冠軍、2019 世界盃先鋒亞軍、2025 馬德里世界盃銀牌）</li>
  <li>Erik Noya Cardona（2021 世錦賽速度銀牌）</li>
  </ul>
</li>
<li><strong>戶外聖地</strong>：Siurana、El Chorro、Rodellar、Margalef 等地是世界級攀岩勝地</li>
<li><strong>特色</strong>：地中海型氣候，全年適合戶外攀岩，吸引全球攀岩者前往訓練</li>
</ul>

<h3>瑞士 - SAC</h3>
<p>瑞士是阿爾卑斯攀登的發源地，擁有悠久的登山傳統：</p>
<ul>
<li><strong>協會</strong>：SAC（Swiss Alpine Club / Schweizer Alpen-Club）瑞士高山俱樂部，擁有約 15 萬名會員</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Swiss Climbing Cup</strong>：瑞士攀岩盃，包含先鋒、抱石、速度三項</li>
  <li><strong>Swiss Championships</strong>：瑞士全國錦標賽</li>
  <li><strong>Youth Series</strong>：青少年賽事系統（10-16 歲）</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：維拉爾（Villars）是 IFSC 世界盃常設站點</li>
<li><strong>戶外聖地</strong>：Magic Wood 是世界知名的花崗岩抱石區</li>
<li><strong>知名選手</strong>：Petra Klingler（2016 世錦賽抱石金牌、2022 冰攀世界冠軍，史上唯一同時在抱石與冰攀奪得世界冠軍的選手）</li>
<li><strong>速度發展</strong>：Gilles Meili 保持瑞士速度紀錄（5.85 秒）</li>
</ul>

<h3>義大利 - FASI</h3>
<p>義大利是歐洲攀岩重鎮，擁有深厚的攀岩歷史：</p>
<ul>
<li><strong>官網</strong>：federclimb.it</li>
<li><strong>協會</strong>：FASI（Federazione Arrampicata Sportiva Italiana）義大利運動攀登聯合會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Campionato Italiano</strong>：義大利全國錦標賽（先鋒、抱石、速度）</li>
  <li><strong>Coppa Italia</strong>：義大利盃系列賽</li>
  <li><strong>Campionato Italiano Giovanile</strong>：青少年全國賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：Arco di Trento 是世界盃與 Rock Master 的常設舉辦地</li>
<li><strong>歷史地位</strong>：1985 年在 Bardonecchia 舉辦首場國際先鋒攀登比賽，是競技攀岩的發源地之一</li>
<li><strong>知名選手</strong>：Stefano Ghisolfi（2021 世界盃總冠軍、6 座世界盃分站冠軍、完攀多條 9b+ 路線）</li>
<li><strong>戶外聖地</strong>：Arco、Valle Orco 等地是世界級攀岩勝地</li>
</ul>

<h3>德國 - DAV</h3>
<p>德國擁有全球最大的攀岩協會：</p>
<ul>
<li><strong>協會</strong>：DAV（Deutscher Alpenverein）德國高山俱樂部，是世界上最大的攀岩組織</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Deutsche Meisterschaft</strong>：德國全國錦標賽（先鋒、抱石、速度）</li>
  <li><strong>Deutsche Meisterschaft Bouldern</strong>：德國抱石錦標賽，2025 年在慕尼黑奧林匹克公園舉行</li>
  <li><strong>Deutsche Meisterschaft Paraclimbing</strong>：2025 年首次舉辦官方德國身障攀岩錦標賽</li>
  </ul>
</li>
<li><strong>攀岩設施</strong>：德國擁有歐洲最大的室內攀岩社群，眾多 DAV 攀岩中心遍布全國</li>
<li><strong>知名選手</strong>：Alexander Megos（史上首位 onsight 9a 的選手、完攀三條 9b+ 路線、2024 巴黎奧運參賽選手）</li>
<li><strong>特色</strong>：強調戶外攀岩傳統，Frankenjura 是德國最著名的攀岩區域</li>
</ul>

<h2>亞洲</h2>

<h3>日本 - JMSCA</h3>
<p>日本是亞洲攀岩強國，在國際賽場上表現優異：</p>
<ul>
<li><strong>官網</strong>：jma-climbing.org</li>
<li><strong>協會</strong>：JMSCA（Japan Mountaineering and Sport Climbing Association）負責管理攀岩運動</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>日本選手權大会</strong>：全日本攀岩錦標賽（先鋒、抱石、速度、複合）</li>
  <li><strong>ボルダリングジャパンカップ</strong>：日本抱石盃</li>
  <li><strong>リードジャパンカップ</strong>：日本先鋒盃</li>
  <li><strong>ユース選手権</strong>：青少年全國賽</li>
  </ul>
</li>
<li><strong>青訓系統</strong>：從小學開始培養選手，完整的梯隊制度</li>
<li><strong>知名選手</strong>：野口啟代、野中生萌、楢﨑智亞、緒方良行等</li>
<li><strong>特色</strong>：2020 東京奧運主辦國，大力推動攀岩運動</li>
</ul>

<h3>韓國 - KAF</h3>
<p>韓國在攀岩領域持續進步：</p>
<ul>
<li><strong>官網</strong>：climbing.or.kr</li>
<li><strong>協會</strong>：KAF（Korea Alpine Federation）韓國山岳聯盟</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>전국스포츠클라이밍선수권대회</strong>：韓國全國運動攀登錦標賽</li>
  <li><strong>Korea Cup</strong>：韓國盃系列賽</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：2025 年首爾將舉辦 IFSC 世界錦標賽</li>
<li><strong>知名選手</strong>：Chaehyun Seo 等在國際賽場表現亮眼</li>
<li><strong>設施</strong>：釜山攀岩中心等現代化設施</li>
</ul>

<h3>中國 - CMA</h3>
<p>中國在速度攀岩領域具有傳統優勢：</p>
<ul>
<li><strong>官網</strong>：cmasports.cn</li>
<li><strong>協會</strong>：CMA（Chinese Mountaineering Association）中國登山協會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>全國攀岩錦標賽</strong>：最高等級國內賽事</li>
  <li><strong>全國攀岩聯賽</strong>：系列巡迴賽</li>
  <li><strong>全國青年攀岩錦標賽</strong>：青少年賽事</li>
  </ul>
</li>
<li><strong>培訓體系</strong>：國家隊集中訓練模式，專注於速度攀岩</li>
<li><strong>知名選手</strong>：鍾齊鑫曾多次打破速度攀岩世界紀錄</li>
</ul>

<h3>台灣 - CTAA</h3>
<p>中華民國山岳協會是台灣攀岩運動的官方組織：</p>
<ul>
<li><strong>官網</strong>：climbing.org.tw</li>
<li><strong>協會</strong>：CTAA（Chinese Taipei Alpine Association）中華民國山岳協會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>全國運動攀登錦標賽</strong>：最高等級國內賽事</li>
  <li><strong>全國青年運動攀登錦標賽</strong>：青少年賽事</li>
  <li><strong>全國中等學校運動攀登錦標賽</strong>：學生組賽事</li>
  </ul>
</li>
<li><strong>參賽管道</strong>：透過各縣市攀岩委員會報名參賽</li>
<li><strong>比賽系統</strong>：ctaa.j91.me 提供賽事資訊與成績查詢</li>
</ul>

<h3>印尼 - FPTI</h3>
<p>印尼是男子速度攀岩的絕對強國：</p>
<ul>
<li><strong>協會</strong>：FPTI（Federasi Panjat Tebing Indonesia）印尼攀岩聯合會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Kejurnas Panjat Tebing</strong>：印尼全國攀岩錦標賽</li>
  <li><strong>PON（Pekan Olahraga Nasional）</strong>：印尼全國運動會攀岩項目</li>
  </ul>
</li>
<li><strong>國際賽事</strong>：2025 年峇里島首度舉辦 IFSC 世界盃</li>
<li><strong>培訓體系</strong>：國家隊專注於速度攀岩，成效卓著</li>
<li><strong>知名選手</strong>：Veddriq Leonardo（2024 奧運金牌）、Kiromal Katibin（前世界紀錄保持人）</li>
</ul>

<h2>大洋洲</h2>

<h3>澳洲 - Sport Climbing Australia</h3>
<p>澳洲擁有豐富的戶外攀岩資源：</p>
<ul>
<li><strong>官網</strong>：sportclimbingaustralia.org.au</li>
<li><strong>協會</strong>：SCA（Sport Climbing Australia）澳洲運動攀登協會</li>
<li><strong>國內賽事</strong>：
  <ul>
  <li><strong>Australian National Championships</strong>：澳洲全國錦標賽</li>
  <li><strong>Australian Bouldering Open</strong>：澳洲抱石公開賽</li>
  <li><strong>State Championships</strong>：各州錦標賽</li>
  </ul>
</li>
<li><strong>戶外攀岩</strong>：藍山（Blue Mountains）、Arapiles 等地是知名的攀岩勝地</li>
<li><strong>特色</strong>：結合戶外攀岩傳統與現代競技發展</li>
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
<li><a href="https://www.ifsc-climbing.org/about/member-federations" target="_blank" rel="noopener noreferrer">IFSC Member Federations - 各國攀岩協會列表</a></li>
<li><a href="https://usaclimbing.org/" target="_blank" rel="noopener noreferrer">USA Climbing 官網</a></li>
<li><a href="https://usaclimbing.org/domestic-world-cup-events/" target="_blank" rel="noopener noreferrer">USA Climbing - 2026 Domestic World Cups</a></li>
<li><a href="https://www.ffme.fr/" target="_blank" rel="noopener noreferrer">FFME 法國登山攀岩協會</a></li>
<li><a href="https://www.kletterverband.at/" target="_blank" rel="noopener noreferrer">KVÖ 奧地利攀岩協會</a></li>
<li><a href="https://www.jma-climbing.org/" target="_blank" rel="noopener noreferrer">JMSCA 日本山岳運動攀登協會</a></li>
<li><a href="https://climbing.or.kr/" target="_blank" rel="noopener noreferrer">KAF 韓國山岳聯盟</a></li>
<li><a href="https://www.climbing.org.tw/" target="_blank" rel="noopener noreferrer">CTAA 中華民國山岳協會</a></li>
<li><a href="https://www.tpenoc.net/sport/sports-climbing/" target="_blank" rel="noopener noreferrer">中華奧林匹克委員會 - 運動攀登</a></li>
<li><a href="https://www.sportclimbingaustralia.org.au/" target="_blank" rel="noopener noreferrer">Sport Climbing Australia 官網</a></li>
<li><a href="https://www.sac-cas.ch/en" target="_blank" rel="noopener noreferrer">SAC 瑞士高山俱樂部</a></li>
<li><a href="https://www.federclimb.it/" target="_blank" rel="noopener noreferrer">FASI 義大利運動攀登聯合會</a></li>
<li><a href="https://en.wikipedia.org/wiki/German_Alpine_Club" target="_blank" rel="noopener noreferrer">DAV 德國高山俱樂部 - Wikipedia</a></li>
<li><a href="https://www.lacrux.com/en/competition/German-Bouldering-Championship-2025-info-livestream/" target="_blank" rel="noopener noreferrer">German Bouldering Championship 2025 - Lacrux</a></li>
<li><a href="https://www.ifsc-climbing.org/news/curitiba-brazil-to-host-first-ever-ifsc-world-cup-in-south-america-in-2025" target="_blank" rel="noopener noreferrer">IFSC - Curitiba World Cup 2025</a></li>
<li><a href="https://en.wikipedia.org/wiki/Petra_Klingler" target="_blank" rel="noopener noreferrer">Petra Klingler - Wikipedia</a></li>
<li><a href="https://en.wikipedia.org/wiki/Stefano_Ghisolfi" target="_blank" rel="noopener noreferrer">Stefano Ghisolfi - Wikipedia</a></li>
<li><a href="https://en.wikipedia.org/wiki/Alexander_Megos" target="_blank" rel="noopener noreferrer">Alexander Megos - Wikipedia</a></li>
<li><a href="https://www.ifsc-climbing.org/news/ifsc-world-cup-series-to-return-to-prague-in-2026-and-2028" target="_blank" rel="noopener noreferrer">IFSC - Prague World Cup 2026 & 2028</a></li>
<li><a href="https://en.wikipedia.org/wiki/Adam_Ondra" target="_blank" rel="noopener noreferrer">Adam Ondra - Wikipedia</a></li>
<li><a href="https://en.pzs.si/" target="_blank" rel="noopener noreferrer">PZS 斯洛維尼亞高山協會</a></li>
<li><a href="https://www.slovenia.info/en/press-centre/news-of-the-tourism-press-agency/31139-koper-secures-sport-climbing-world-cup-until-2028" target="_blank" rel="noopener noreferrer">Koper World Cup 2028 - Slovenia.info</a></li>
<li><a href="https://en.wikipedia.org/wiki/Janja_Garnbret" target="_blank" rel="noopener noreferrer">Janja Garnbret - Wikipedia</a></li>
<li><a href="https://www.ifsc-climbing.org/events/ifsc-world-cup-poland-2025" target="_blank" rel="noopener noreferrer">IFSC World Cup Krakow 2025</a></li>
<li><a href="https://en.wikipedia.org/wiki/Aleksandra_Miros%C5%82aw" target="_blank" rel="noopener noreferrer">Aleksandra Mirosław - Wikipedia</a></li>
<li><a href="https://thebmc.co.uk/en/performance" target="_blank" rel="noopener noreferrer">BMC Performance - GB Climbing</a></li>
<li><a href="https://thebmc.co.uk/en/gb-climbing-names-2026-performance-programme-athletes" target="_blank" rel="noopener noreferrer">GB Climbing 2026 Performance Programme</a></li>
<li><a href="https://en.wikipedia.org/wiki/Alberto_Gin%C3%A9s" target="_blank" rel="noopener noreferrer">Alberto Ginés López - Wikipedia</a></li>
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
  (SELECT id FROM users WHERE username = 'nobodyclimb'),
  '奧運攀岩項目完整解析',
  'olympic-climbing-complete-guide',
  '攀岩自東京奧運成為正式項目後備受矚目。本文詳細介紹攀岩進入奧運的歷程、東京與巴黎的賽制差異、各項目規則，以及台灣選手的奧運之路。',
  '<h2>攀岩進入奧運歷程</h2>
<p>攀岩運動進入奧林匹克運動會是歷史性的里程碑，這段旅程充滿了攀岩界的努力與期待：</p>

<h3>推動歷程</h3>
<ul>
<li><strong>2010 年</strong>：IFSC 開始積極向國際奧委會（IOC）爭取攀岩入奧</li>
<li><strong>2013 年</strong>：攀岩被列入 2020 奧運候選項目之一</li>
<li><strong>2016 年 8 月</strong>：IOC 正式宣布將攀岩納入 2020 東京奧運，與滑板、衝浪、空手道、棒壘球一同成為新增項目</li>
<li><strong>2021 年 8 月</strong>：因疫情延期一年後，攀岩終於在東京奧運首次亮相</li>
</ul>

<h3>歷史意義</h3>
<p>攀岩入奧對整個運動發展帶來深遠影響：</p>
<ul>
<li>大幅提升攀岩運動的全球知名度與媒體曝光</li>
<li>吸引更多贊助商與資源投入</li>
<li>各國政府開始重視攀岩選手培訓</li>
<li>室內攀岩館在全球快速增長</li>
</ul>

<h2>東京 2020 賽制</h2>
<p>東京奧運採用三項全能制（Combined），引發了不少討論，但也創造了許多難忘時刻：</p>

<h3>賽制說明</h3>
<ul>
<li><strong>項目組合</strong>：先鋒、抱石、速度三項合一</li>
<li><strong>計分方式</strong>：三項排名相乘，數字越小越好</li>
<li><strong>範例</strong>：若選手三項分別為第 1、2、3 名，總分為 1×2×3=6</li>
<li><strong>參賽名額</strong>：男女各 20 名選手</li>
</ul>

<h3>賽制爭議</h3>
<p>三項全能制引發了專項選手的困境，但也有其設計考量：</p>
<ul>
<li><strong>速度選手的挑戰</strong>：速度攀岩與先鋒/抱石的訓練方式截然不同，專攻速度的選手在技術項目表現較弱</li>
<li><strong>技術選手的困境</strong>：先鋒/抱石選手通常不擅長速度攀岩，被迫分心訓練非專長項目</li>
<li><strong>IOC 的考量</strong>：由於東京奧運的名額限制，三項合一是讓攀岩入奧的折衷方案</li>
</ul>

<h3>東京奧運精彩時刻</h3>
<p>儘管賽制有爭議，東京奧運仍創造了許多難忘時刻：</p>
<ul>
<li><strong>女子賽</strong>：Janja Garnbret 以壓倒性優勢奪金，在抱石與先鋒都展現絕對統治力</li>
<li><strong>男子賽</strong>：18 歲的 Alberto Ginés López 成為史上首位奧運攀岩金牌得主，展現年輕選手的無限潛力</li>
<li><strong>銅牌之爭</strong>：日本選手野口啟代在主場觀眾面前奪得銅牌，為她的職業生涯畫下完美句點</li>
</ul>

<h3>金牌得主</h3>
<ul>
<li><strong>男子</strong>：Alberto Ginés López（西班牙）- 18 歲，史上首位奧運攀岩冠軍</li>
<li><strong>女子</strong>：Janja Garnbret（斯洛維尼亞）- 22 歲，抱石與先鋒雙料統治者</li>
</ul>

<h2>巴黎 2024 賽制改革</h2>
<p>巴黎奧運對攀岩賽制進行了重大改革，回應了選手與攀岩界的訴求：</p>

<h3>項目分離</h3>
<ul>
<li><strong>速度攀岩</strong>：成為完全獨立的項目，讓速度選手能專注發揮專長</li>
<li><strong>抱石與先鋒複合賽</strong>：結合兩個技術項目，計算綜合成績</li>
</ul>

<h3>複合賽計分方式</h3>
<p>巴黎奧運的複合賽採用新的計分系統：</p>
<ul>
<li><strong>抱石</strong>：每條路線 Top 25 分、Zone 10 分，扣除嘗試次數</li>
<li><strong>先鋒</strong>：依據攀登高度計分，滿分 100 分</li>
<li><strong>總分</strong>：兩項分數相加，取得最高總分者獲勝</li>
</ul>

<h3>改革優點</h3>
<ul>
<li><strong>獎牌數增加</strong>：從 2 面增加到 4 面（男女各 2 項）</li>
<li><strong>專業化</strong>：選手更能發揮專長，速度選手不必練習技術項目</li>
<li><strong>觀賞性提升</strong>：速度賽的對決更加刺激，複合賽的技術較量更加精彩</li>
<li><strong>名額增加</strong>：更多國家有機會參與奧運攀岩</li>
</ul>

<h3>巴黎 2024 金牌得主</h3>
<ul>
<li><strong>男子速度攀岩</strong>：Veddriq Leonardo（印尼）- 印尼速度攀岩強國的代表</li>
<li><strong>女子速度攀岩</strong>：Aleksandra Mirosław（波蘭）- 以破世界紀錄的 6.06 秒奪金</li>
<li><strong>男子抱石與先鋒複合賽</strong>：Toby Roberts（英國）- 19 歲的新星</li>
<li><strong>女子抱石與先鋒複合賽</strong>：Janja Garnbret（斯洛維尼亞）- 成功衛冕，成為雙屆奧運金牌得主</li>
</ul>
<p>Janja Garnbret 在巴黎奧運成功衛冕，延續她在東京奧運的統治地位，鞏固了「史上最偉大女子攀岩選手」的地位。Aleksandra Mirosław 則以破世界紀錄的表現奪金，證明賽制改革讓專項選手能夠充分發揮。</p>

<h2>洛杉磯 2028 展望</h2>
<p>洛杉磯奧運的攀岩項目令人期待，美國主場將帶來更多看點：</p>

<h3>賽制預期</h3>
<ul>
<li><strong>維持巴黎賽制</strong>：預期將延續速度獨立 + 複合賽的模式</li>
<li><strong>可能調整</strong>：IFSC 持續優化計分系統，可能有微幅調整</li>
</ul>

<h3>場館規劃</h3>
<ul>
<li>洛杉磯組委會正在規劃攀岩比賽場地</li>
<li>可能利用現有設施改建，或新建專業攀岩場館</li>
<li>考慮戶外場地的可能性，增加比賽的視覺效果</li>
</ul>

<h3>美國主場優勢</h3>
<p>美國攀岩選手近年實力大幅提升，主場作戰備受期待：</p>
<ul>
<li><strong>Sam Watson</strong>：男子速度攀岩世界紀錄保持人（4.64 秒），有望在主場奪金</li>
<li><strong>Colin Duffy</strong>：複合賽好手，東京奧運經驗豐富</li>
<li><strong>Brooke Raboutou</strong>：女子複合賽選手，技術全面</li>
</ul>

<h2>比賽規則詳解</h2>

<h3>先鋒攀登規則</h3>
<ul>
<li><strong>時間限制</strong>：6 分鐘</li>
<li><strong>岩壁規格</strong>：高度 15 公尺以上，路線約 40-50 個手點</li>
<li><strong>計分方式</strong>：以最高點計分，每個手點有編號，「+」表示已控制並做出有效移動</li>
<li><strong>觀察時間</strong>：決賽前有 6 分鐘集體觀察時間</li>
<li><strong>隔離區</strong>：選手在比賽前須待在隔離區，不得觀看其他選手攀爬</li>
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
<li><strong>岩壁高度</strong>：4-5 公尺</li>
<li><strong>路線數</strong>：資格賽 5 條、決賽 4 條</li>
<li><strong>計分點</strong>：
  <ul>
  <li>Zone 點：中繼點，觸碰即得分（10 分）</li>
  <li>Top 點：終點，需穩定控制（25 分）</li>
  </ul>
</li>
<li><strong>扣分</strong>：每次嘗試扣 0.1 分</li>
<li><strong>時間限制</strong>：每條路線約 4-5 分鐘</li>
<li><strong>安全措施</strong>：地面鋪設厚軟墊，無繩索確保</li>
</ul>

<h3>速度攀岩規則</h3>
<ul>
<li><strong>標準牆面</strong>：15 公尺高、5 度傾斜，全球統一路線</li>
<li><strong>比賽方式</strong>：淘汰賽制，兩人同時攀爬對決</li>
<li><strong>計時系統</strong>：電子感應計時，精確到千分之一秒</li>
<li><strong>搶跑判罰</strong>：起跑反應時間在 0.1 秒內為搶跑，首次警告，二次失格</li>
<li><strong>勝負判定</strong>：先觸頂者獲勝，若一方失誤墜落，另一方自動獲勝</li>
</ul>

<h2>台灣選手奧運之路</h2>

<h3>選拔機制</h3>
<p>台灣選手要參加奧運，需要經過以下途徑：</p>
<ol>
<li>在世界盃等國際賽事累積 IFSC 積分</li>
<li>參加奧運資格賽（亞洲區資格賽或世界資格賽）</li>
<li>達到參賽標準或取得洲際配額</li>
<li>通過中華奧會審核與代表團選拔</li>
</ol>

<h3>台灣攀岩發展現況</h3>
<p>台灣攀岩運動近年蓬勃發展：</p>
<ul>
<li><strong>室內岩館增長</strong>：全台攀岩館數量持續增加，提供更多訓練場地</li>
<li><strong>青訓系統</strong>：各縣市開始建立青少年攀岩培訓體系</li>
<li><strong>國際賽事</strong>：台灣選手持續參與亞洲錦標賽與世界盃分站賽</li>
</ul>

<h3>挑戰與機會</h3>
<p>台灣攀岩選手面臨的挑戰：</p>
<ul>
<li>國際賽事經驗相對較少</li>
<li>訓練資源與環境有待提升</li>
<li>需要更多高水準對手的磨練</li>
</ul>
<p>但近年台灣攀岩選手持續進步，在亞洲賽事中展現實力，未來在國際賽場上的表現值得期待。</p>

<h3>未來展望</h3>
<p>台灣攀岩界正在努力邁向奧運舞台：</p>
<ul>
<li>加強青年選手培育，建立完整梯隊</li>
<li>增加國際賽事參與機會，累積經驗與積分</li>
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
  (SELECT id FROM users WHERE username = 'nobodyclimb'),
  '速度攀岩世界紀錄史',
  'speed-climbing-world-records-history',
  '速度攀岩是攀岩界最純粹的競速運動。本文記錄男女世界紀錄的演進歷程、各國強權分析、技術解密，以及人體極限的探討。',
  '<h2>速度攀岩簡介</h2>
<p>速度攀岩（Speed Climbing）是攀岩三大競技項目中最獨特的一項，堪稱「垂直版的 100 公尺短跑」：</p>
<ul>
<li><strong>標準化岩壁</strong>：15 公尺高、5 度傾斜角，全球統一規格</li>
<li><strong>固定路線</strong>：自 2007 年起，全球使用統一路線設計，每個手點和腳點的位置都完全相同</li>
<li><strong>比賽本質</strong>：最純粹的競速運動，誰先碰到頂端的計時器誰就贏</li>
<li><strong>對決形式</strong>：兩位選手同時在相鄰的兩道牆面攀爬，面對面的直接對決增添了緊張感</li>
</ul>
<p>由於路線完全固定，選手可以透過數千次的反覆練習，將每一個動作都刻入肌肉記憶，追求分秒必爭的極致表現。這種標準化讓全球的速度攀岩選手可以在任何比賽場地發揮相同的訓練成果，也讓世界紀錄的比較更具意義。</p>

<h3>標準路線的歷史</h3>
<p>速度攀岩的標準化路線是這項運動發展的重要里程碑：</p>
<ul>
<li><strong>2005 年以前</strong>：各比賽使用不同的路線設計，紀錄無法比較</li>
<li><strong>2007 年</strong>：IFSC 制定第一代標準路線，開啟全球統一時代</li>
<li><strong>2016 年修訂</strong>：因應選手技術進步，微調部分手點位置</li>
<li><strong>現今規格</strong>：20 個手點、11 個腳點，路線總長度約 15.5 公尺</li>
</ul>
<p>標準路線的設計經過精密計算，確保選手可以用最流暢的動作完成攀爬，同時保持足夠的挑戰性。</p>

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
<li><strong>成績</strong>：6.03 秒</li>
<li><strong>創下時間</strong>：2025 年 9 月（首爾世界錦標賽決賽）</li>
<li><strong>特點</strong>：連續多次打破自己保持的紀錄，在決賽中刷新世界紀錄奪金</li>
<li><strong>地位</strong>：被譽為女子速度攀岩的統治者，3 屆世界冠軍</li>
</ul>

<h2>紀錄演進史</h2>

<h3>男子紀錄演進</h3>
<table>
<tr><th>年份</th><th>選手</th><th>國籍</th><th>成績</th><th>賽事</th></tr>
<tr><td>2017</td><td>Reza Alipourshenazandifar</td><td>伊朗</td><td>5.48 秒</td><td>南京世界盃</td></tr>
<tr><td>2021</td><td>Veddriq Leonardo</td><td>印尼</td><td>5.20 秒</td><td>鹽湖城世界盃</td></tr>
<tr><td>2022</td><td>Kiromal Katibin</td><td>印尼</td><td>5.00 秒</td><td>首爾世界盃</td></tr>
<tr><td>2023</td><td>Veddriq Leonardo</td><td>印尼</td><td>4.90 秒</td><td>亞洲錦標賽</td></tr>
<tr><td>2024</td><td>Sam Watson</td><td>美國</td><td>4.74 秒</td><td>首爾世界盃</td></tr>
<tr><td>2025</td><td>Sam Watson</td><td>美國</td><td>4.64 秒</td><td>峇里島世界盃</td></tr>
</table>
<p>從 2017 年的 5.48 秒到 2025 年的 4.64 秒，男子紀錄在短短幾年內進步了將近一秒，這在競速運動中是相當驚人的進步幅度。印尼與美國選手輪流刷新紀錄，展現兩國在速度攀岩領域的統治力。</p>

<h3>女子紀錄演進</h3>
<table>
<tr><th>年份</th><th>選手</th><th>國籍</th><th>成績</th><th>賽事</th></tr>
<tr><td>2021</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.84 秒</td><td>鹽湖城世界盃</td></tr>
<tr><td>2022</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.53 秒</td><td>首爾世界盃</td></tr>
<tr><td>2023</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.24 秒</td><td>雅加達亞洲錦標賽</td></tr>
<tr><td>2024</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.06 秒</td><td>巴黎奧運</td></tr>
<tr><td>2025</td><td>Aleksandra Miroslaw</td><td>波蘭</td><td>6.03 秒</td><td>首爾世界錦標賽</td></tr>
</table>
<p>Aleksandra Miroslaw 獨自統治女子速度攀岩界，從 2021 年至 2025 年連續五年打破自己的紀錄，展現出絕對的統治力。她在 2025 首爾世錦賽決賽中以 6.03 秒刷新紀錄，同時奪得第三座世界冠軍。</p>

<h2>速度攀岩強國</h2>

<h3>印尼：男子傳統強國</h3>
<p>印尼在男子速度攀岩領域有著輝煌的歷史，是當之無愧的速度攀岩王國：</p>
<ul>
<li><strong>雙子星組合</strong>：Veddriq Leonardo 與 Kiromal Katibin 形成強大的雙保險，兩人輪流打破世界紀錄</li>
<li><strong>國家培訓體系</strong>：印尼攀岩協會（FPTI）建立完整的選拔與培訓系統</li>
<li><strong>集訓中心</strong>：國家隊在雅加達設有專業訓練基地，配備國際標準設施</li>
<li><strong>政府支持</strong>：速度攀岩被列為印尼重點發展項目，獲得充足的訓練經費</li>
<li><strong>青訓系統</strong>：從各省選拔有潛力的年輕選手，從小培養專業訓練</li>
</ul>
<p>Veddriq Leonardo 在 2024 年巴黎奧運奪得男子速度攀岩金牌，為印尼攀岩寫下歷史性的一頁。</p>

<h3>波蘭：女子統治地位</h3>
<p>Aleksandra Miroslaw 以一人之力讓波蘭成為女子速度攀岩界的霸主：</p>
<ul>
<li><strong>連續稱霸</strong>：2021-2025 年間幾乎壟斷所有重大賽事冠軍</li>
<li><strong>紀錄終結者</strong>：世界紀錄的唯一保持者，連續五年刷新自己的紀錄</li>
<li><strong>技術完美</strong>：起跑反應、動作流暢度、觸頂時機都達到近乎完美的水準</li>
<li><strong>心理強度</strong>：在最大壓力的決賽中仍能發揮最佳表現，2024 巴黎奧運決賽以破紀錄的 6.06 秒奪金</li>
<li><strong>訓練典範</strong>：她的訓練方法和比賽策略成為其他女子選手學習的對象</li>
</ul>

<h3>中國：完整培訓體系</h3>
<p>中國在速度攀岩有著悠久的傳統與系統化的培訓：</p>
<ul>
<li><strong>國家隊體制</strong>：採用集中訓練模式，選手可以專注訓練</li>
<li><strong>歷史榮耀</strong>：鍾齊鑫曾長期保持世界紀錄，是速度攀岩的傳奇人物</li>
<li><strong>女子競爭力</strong>：中國女子選手在國際賽場上始終保持競爭力</li>
<li><strong>梯隊建設</strong>：培訓系統持續輸出優秀選手，確保人才不斷層</li>
<li><strong>科技輔助</strong>：運用運動科學分析選手動作，優化訓練方法</li>
</ul>

<h3>美國：新興勢力</h3>
<p>美國近年在速度攀岩領域異軍突起：</p>
<ul>
<li><strong>Sam Watson 的崛起</strong>：打破男子世界紀錄，成為新一代速度王者</li>
<li><strong>訓練創新</strong>：結合美國運動科學優勢，發展出獨特的訓練方法</li>
<li><strong>青年發展</strong>：更多年輕選手投入速度攀岩訓練，人才庫持續擴大</li>
<li><strong>2028 主場優勢</strong>：洛杉磯奧運將是美國速度攀岩展現實力的最佳舞台</li>
</ul>

<h3>其他競爭國家</h3>
<p>速度攀岩的版圖持續擴大，其他國家也展現競爭力：</p>
<ul>
<li><strong>伊朗</strong>：Reza Alipourshenazandifar 曾保持世界紀錄，伊朗一直是速度攀岩強國</li>
<li><strong>俄羅斯</strong>：擁有深厚的速度攀岩傳統，培養出多位世界級選手</li>
<li><strong>法國</strong>：近年積極發展速度攀岩，有多位選手進入世界排名前列</li>
<li><strong>日本</strong>：雖然以抱石與先鋒見長，速度攀岩也在持續進步</li>
</ul>

<h2>技術分析</h2>
<p>速度攀岩的快雖然看似簡單，但背後有著複雜的技術要素，每一個環節都經過精密計算：</p>

<h3>起跑反應時間</h3>
<p>起跑是決勝的關鍵之一，頂尖選手在這個環節下足功夫：</p>
<ul>
<li><strong>電子感應系統</strong>：比賽採用壓力感應起跑墊，精確到千分之一秒</li>
<li><strong>搶跑規則</strong>：反應時間在 0.1 秒以內會被判定為搶跑，首次警告、二次失格</li>
<li><strong>最佳反應</strong>：頂尖選手的反應時間約在 0.12-0.15 秒之間，任何超出這個範圍都可能落後</li>
<li><strong>訓練方法</strong>：選手會進行專門的反應訓練，包括聲光刺激反應練習</li>
</ul>

<h3>爆發力訓練</h3>
<p>速度攀岩是極度依賴爆發力的運動，訓練方式獨特：</p>
<ul>
<li><strong>腿部力量</strong>：腿部推蹬力量決定上升速度，深蹲、跳箱是基礎訓練</li>
<li><strong>上肢拉力</strong>：手臂不只是抓握，還要配合腿部動作快速上拉</li>
<li><strong>核心穩定</strong>：核心力量確保身體在高速移動時保持穩定</li>
<li><strong>動作協調</strong>：需要同時具備垂直與水平方向的爆發力，並完美協調</li>
<li><strong>專項訓練</strong>：選手每天會進行數十次的標準路線練習</li>
</ul>

<h3>路線記憶與肌肉記憶</h3>
<p>速度攀岩的精髓在於將動作練到自動化：</p>
<ul>
<li><strong>重複練習</strong>：頂尖選手每年在標準路線上練習超過一萬次</li>
<li><strong>動作分解</strong>：將整條路線分解成多個動作段落，分別優化</li>
<li><strong>節奏訓練</strong>：培養穩定的攀爬節奏，每個動作的時機都精準到毫秒</li>
<li><strong>自動化執行</strong>：比賽時幾乎不需要思考，完全靠本能反應</li>
<li><strong>影片分析</strong>：透過高速攝影分析動作細節，找出可以改進的地方</li>
</ul>

<h3>心理素質</h3>
<p>速度攀岩的心理挑戰不亞於體能挑戰：</p>
<ul>
<li><strong>對決壓力</strong>：面對面的直接對決帶來極大心理壓力</li>
<li><strong>失誤代價</strong>：一次失誤可能就輸掉比賽，容錯率極低</li>
<li><strong>專注力</strong>：需要在起跑信號響起的瞬間達到最佳專注狀態</li>
<li><strong>抗干擾</strong>：無視對手的存在，專注於自己的節奏</li>
<li><strong>大賽經驗</strong>：在奧運、世錦賽等大賽的壓力下仍能發揮水準</li>
</ul>

<h2>與其他競速運動的比較</h2>
<p>速度攀岩常被拿來與其他競速運動比較：</p>
<ul>
<li><strong>100 公尺短跑</strong>：同樣追求極致速度，但速度攀岩多了垂直維度的挑戰</li>
<li><strong>游泳短距離</strong>：類似的爆發力需求，但介質完全不同</li>
<li><strong>短道速滑</strong>：同樣有直接對決的形式，增添比賽張力</li>
</ul>
<p>速度攀岩獨特之處在於結合了力量、速度、技巧與心理素質，是一項綜合性極高的競速運動。</p>

<h2>未來展望</h2>

<h3>能否突破 4.5 秒？</h3>
<p>這是攀岩界最熱議的話題之一：</p>
<ul>
<li><strong>當前距離</strong>：Sam Watson 的 4.64 秒距離 4.5 秒只差 0.14 秒</li>
<li><strong>進步趨勢</strong>：從 2017 年的 5.48 秒到 2025 年的 4.64 秒，平均每年進步約 0.1 秒</li>
<li><strong>樂觀預測</strong>：若保持這個進步速度，4.5 秒可能在 2026-2027 年被突破</li>
<li><strong>保守觀點</strong>：隨著接近極限，每 0.01 秒的進步都會越來越困難</li>
</ul>

<h3>人體極限探討</h3>
<p>速度攀岩的極限涉及多個生理因素：</p>
<ul>
<li><strong>反應時間極限</strong>：人類視覺到肌肉反應的最快時間約 0.1 秒</li>
<li><strong>肌肉收縮速度</strong>：肌纖維的收縮速度有物理上限</li>
<li><strong>動作效率</strong>：最優化的動作路徑已經被研究透徹</li>
<li><strong>歷史啟示</strong>：每項運動的「極限」都曾被認為不可能突破，但總有人打破</li>
</ul>

<h3>訓練科學進步</h3>
<p>現代運動科學正在推動速度攀岩的發展：</p>
<ul>
<li><strong>動作捕捉</strong>：3D 動作分析技術幫助找出可以優化的細節</li>
<li><strong>數據分析</strong>：比賽數據的深度分析，找出成功與失敗的關鍵因素</li>
<li><strong>個人化訓練</strong>：根據選手的身體特徵設計專屬訓練計畫</li>
<li><strong>恢復技術</strong>：更好的恢復方法讓選手能承受更高強度訓練</li>
<li><strong>營養科學</strong>：精準的營養補給優化選手的體能狀態</li>
</ul>

<h3>未來新星</h3>
<p>下一代速度攀岩選手已經嶄露頭角：</p>
<ul>
<li>各國青年選手的成績持續逼近成年紀錄</li>
<li>更年輕的選手意味著更長的訓練時間與更大的潛力</li>
<li>全球速度攀岩人口增加，選材範圍更廣</li>
</ul>

<h2>結語</h2>
<p>速度攀岩是攀岩運動中最容易理解、最具觀賞性的項目。看著選手在 15 公尺的岩壁上飛速攀爬，在短短幾秒內完成比賽，那種純粹的速度與力量之美，總是讓人熱血沸騰。</p>
<p>從 2017 年的 5.48 秒到 2025 年的 4.64 秒，我們見證了人類在這項運動中的驚人進步。隨著奧運舞台的加持、訓練科學的進步，以及更多年輕選手的投入，速度攀岩的紀錄必將繼續被刷新。讓我們一起期待下一個「不可能」被打破的時刻！</p>

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

-- 5. 先鋒攀登深度介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_lead_climbing',
  (SELECT id FROM users WHERE username = 'nobodyclimb'),
  '先鋒攀登深度介紹：技術、策略與傳奇選手',
  'lead-climbing-complete-guide',
  '先鋒攀登是攀岩競技中最具技術性與策略性的項目。本文深入介紹先鋒攀登的歷史演進、比賽規則、技術要素、傳奇選手，以及如何欣賞這項運動。',
  '<h2>先鋒攀登簡介</h2>
<p>先鋒攀登（Lead Climbing）是競技攀岩中歷史最悠久的項目，也是最考驗選手綜合能力的比賽形式。選手需要在限時內攀爬一條從未見過的路線，邊爬邊將繩索扣入快扣（Quickdraw），展現耐力、技術、路線閱讀能力與心理素質的完美結合。</p>

<h2>歷史演進</h2>
<p>先鋒攀登競賽的發展歷程：</p>
<ul>
<li><strong>1985 年</strong>：義大利巴乾涅（Bardonecchia）舉辦首場國際先鋒攀登比賽</li>
<li><strong>1989 年</strong>：首屆世界盃在法國舉行</li>
<li><strong>1991 年</strong>：首屆世界錦標賽舉辦</li>
<li><strong>2007 年</strong>：IFSC 成立，統一管理國際賽事</li>
<li><strong>2020 年</strong>：先鋒攀登作為三項全能的一部分首次登上奧運舞台</li>
<li><strong>2024 年</strong>：巴黎奧運，先鋒攀登與抱石合併為複合賽</li>
</ul>

<h2>比賽規則詳解</h2>

<h3>基本規則</h3>
<ul>
<li><strong>岩壁高度</strong>：世界盃標準為 15 公尺以上</li>
<li><strong>時間限制</strong>：6 分鐘</li>
<li><strong>觀察時間</strong>：決賽前有 6 分鐘集體觀察路線</li>
<li><strong>隔離區</strong>：選手在比賽前須待在隔離區，不得觀看其他選手攀爬</li>
</ul>

<h3>計分方式</h3>
<p>先鋒攀登的計分系統相當精細：</p>
<ul>
<li>每個手點都有編號，攀得越高分數越高</li>
<li>「+」符號表示選手已控制該手點並做出有效移動</li>
<li>例如：「35+」表示控制第 35 點並嘗試移動，但未碰到第 36 點</li>
<li>完攀（Top）是最高分，表示選手成功登頂</li>
</ul>

<h3>常見違規</h3>
<ul>
<li>跳過快扣（未依序扣入繩索）</li>
<li>使用岩壁邊緣或禁止區域</li>
<li>超時未開始攀爬</li>
<li>接受場外指導</li>
</ul>

<h2>技術要素分析</h2>

<h3>1. 路線閱讀（Route Reading）</h3>
<p>路線閱讀是先鋒攀登最關鍵的技能之一：</p>
<ul>
<li>在觀察時間內規劃整條路線的攀爬策略</li>
<li>識別關鍵難點（Crux）的位置</li>
<li>規劃休息點與快扣位置</li>
<li>預判手腳順序與身體姿勢</li>
</ul>

<h3>2. 耐力管理</h3>
<p>先鋒路線通常長達 40-50 個動作，耐力管理至關重要：</p>
<ul>
<li>識別可以「抖手」（Shake Out）休息的位置</li>
<li>控制攀爬節奏，避免過早力竭</li>
<li>在簡單段落節省體力，在難點全力以赴</li>
</ul>

<h3>3. 心理素質</h3>
<p>先鋒攀登對心理素質要求極高：</p>
<ul>
<li>面對未知路線的適應能力</li>
<li>在高處保持冷靜與專注</li>
<li>墜落前的最後嘗試決心</li>
<li>比賽壓力下的穩定發揮</li>
</ul>

<h2>傳奇選手</h2>

<h3>男子選手</h3>
<ul>
<li><strong>Adam Ondra（捷克）</strong>：被譽為史上最偉大的攀岩者，首位完攀 9c 難度路線（Silence）的選手，多次世界冠軍</li>
<li><strong>Jakob Schubert（奧地利）</strong>：世界錦標賽與世界盃常勝軍，技術全面穩定</li>
<li><strong>Stefano Ghisolfi（義大利）</strong>：戶外與競技雙棲的頂尖選手</li>
<li><strong>楢﨑智亞（日本）</strong>：東京奧運銅牌，抱石與先鋒雙強</li>
</ul>

<h3>女子選手</h3>
<ul>
<li><strong>Janja Garnbret（斯洛維尼亞）</strong>：史上最成功的女子攀岩選手，兩屆奧運金牌得主，幾乎壟斷近年所有重大賽事</li>
<li><strong>Jessica Pilz（奧地利）</strong>：先鋒專項強手，世界冠軍得主</li>
<li><strong>野口啟代（日本）</strong>：日本攀岩傳奇，東京奧運銅牌</li>
<li><strong>Chaehyun Seo（韓國）</strong>：新生代頂尖選手，技術細膩</li>
</ul>

<h2>經典賽事場地</h2>
<ul>
<li><strong>因斯布魯克（奧地利）</strong>：歐洲攀岩重鎮，多次舉辦世界盃與世錦賽</li>
<li><strong>霞慕尼（法國）</strong>：攀岩聖地，結合阿爾卑斯山壯麗景色</li>
<li><strong>八王子（日本）</strong>：亞洲頂級攀岩設施</li>
<li><strong>鹽湖城（美國）</strong>：2026 年將舉辦世界盃</li>
</ul>

<h2>如何欣賞先鋒攀登比賽</h2>

<h3>觀賽重點</h3>
<ol>
<li><strong>觀察選手的路線選擇</strong>：不同選手可能採用不同的攀爬方式</li>
<li><strong>注意難點（Crux）</strong>：通常在路線中後段，是勝負關鍵</li>
<li><strong>觀察體力分配</strong>：看選手如何在休息點恢復</li>
<li><strong>感受心理壓力</strong>：特別是決賽最後幾位選手的表現</li>
</ol>

<h3>專業術語</h3>
<ul>
<li><strong>Flash</strong>：首次嘗試即完攀</li>
<li><strong>Crux</strong>：路線中最難的段落</li>
<li><strong>Pump</strong>：前臂充血導致力量下降</li>
<li><strong>Dyno</strong>：動態跳躍動作</li>
<li><strong>Deadpoint</strong>：利用重力暫停的瞬間抓點</li>
</ul>

<h2>結語</h2>
<p>先鋒攀登是攀岩競技中最具深度的項目，結合了體能、技術、策略與心理的完美考驗。觀看頂尖選手在 15 公尺高的岩壁上展現人類的極限能力，是一種獨特的視覺與精神享受。隨著攀岩運動持續發展，先鋒攀登的技術與難度也將不斷突破，讓我們期待更多精彩的比賽！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.ifsc-climbing.org/" target="_blank" rel="noopener noreferrer">IFSC 官方網站</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lead_climbing" target="_blank" rel="noopener noreferrer">Wikipedia - Lead Climbing</a></li>
<li><a href="https://www.climbing.com/" target="_blank" rel="noopener noreferrer">Climbing Magazine</a></li>
<li><a href="https://olympics.com/en/sports/sport-climbing/" target="_blank" rel="noopener noreferrer">Olympics.com - Sport Climbing</a></li>
</ul>',
  NULL,
  'competition',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_lead_climbing', '先鋒攀登');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_lead_climbing', '比賽規則');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_lead_climbing', '選手');

-- 6. 抱石深度介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_bouldering',
  (SELECT id FROM users WHERE username = 'nobodyclimb'),
  '抱石深度介紹：解題藝術與爆發力的完美結合',
  'bouldering-complete-guide',
  '抱石是近年最受歡迎的攀岩項目，強調爆發力、創意與解題能力。本文深入介紹抱石的歷史、比賽規則、技術特點、傳奇選手，以及為何這項運動如此吸引人。',
  '<h2>抱石簡介</h2>
<p>抱石（Bouldering）是在較低的岩壁上進行的攀岩形式，不使用繩索確保，僅依靠地面軟墊保護。每條路線稱為一個「問題」（Problem），選手需要在限時內解決盡可能多的問題。抱石強調爆發力、創意思維與動作解讀能力，是攀岩三大競技項目中最具觀賞性的一項。</p>

<h2>歷史演進</h2>
<p>抱石從訓練方式發展成獨立競技項目：</p>
<ul>
<li><strong>19 世紀末</strong>：法國楓丹白露（Fontainebleau）開始有系統的抱石活動</li>
<li><strong>1998 年</strong>：首屆抱石世界盃舉辦</li>
<li><strong>2001 年</strong>：抱石納入世界錦標賽項目</li>
<li><strong>2007 年</strong>：IFSC 成立後，抱石賽事更加規範化</li>
<li><strong>2020 年</strong>：抱石作為三項全能的一部分首次進入奧運</li>
<li><strong>2024 年</strong>：巴黎奧運，抱石與先鋒合併為複合賽</li>
</ul>

<h2>比賽規則詳解</h2>

<h3>基本規則</h3>
<ul>
<li><strong>岩壁高度</strong>：約 4-5 公尺</li>
<li><strong>問題數量</strong>：資格賽通常 5 條，決賽 4 條</li>
<li><strong>時間限制</strong>：每條問題約 4-5 分鐘（依賽事規定）</li>
<li><strong>安全措施</strong>：地面鋪設厚軟墊，無繩索確保</li>
</ul>

<h3>計分方式（2024 新制）</h3>
<p>IFSC 在 2024 年更新了計分系統，讓觀眾更容易理解：</p>
<ul>
<li><strong>Top（完攀）</strong>：25 分</li>
<li><strong>Zone（中繼點）</strong>：10 分</li>
<li><strong>嘗試次數扣分</strong>：每次嘗試扣 0.1 分</li>
<li><strong>計算方式</strong>：基礎分數減去嘗試次數的扣分</li>
<li><strong>例如</strong>：第 3 次嘗試完攀 = 25 - (3 × 0.1) = 24.7 分</li>
</ul>

<h3>傳統計分方式</h3>
<p>舊制仍在部分賽事使用：</p>
<ul>
<li>先比較 Top 數量</li>
<li>Top 數相同則比較 Zone 數量</li>
<li>再相同則比較達成 Top 與 Zone 的總嘗試次數</li>
</ul>

<h2>技術要素分析</h2>

<h3>1. 動作解讀（Beta Reading）</h3>
<p>抱石最核心的能力是「解題」：</p>
<ul>
<li>觀察岩點的形狀、角度與距離</li>
<li>判斷最佳的手腳順序</li>
<li>預測身體重心的移動路徑</li>
<li>識別是否需要動態或靜態動作</li>
</ul>

<h3>2. 爆發力與力量</h3>
<p>抱石動作通常短而激烈：</p>
<ul>
<li><strong>指力</strong>：抓握各種形狀岩點的能力</li>
<li><strong>拉力</strong>：引體向上與鎖定能力</li>
<li><strong>核心力量</strong>：維持身體張力與協調</li>
<li><strong>腿部力量</strong>：推蹬與跳躍能力</li>
</ul>

<h3>3. 動態動作（Dynamic Moves）</h3>
<p>抱石中常見的動態技巧：</p>
<ul>
<li><strong>Dyno</strong>：雙手放開跳躍抓點</li>
<li><strong>Coordination（協調跳）</strong>：連續動態移動</li>
<li><strong>Paddle Dyno</strong>：用手掌拍擊岩壁借力</li>
<li><strong>Run and Jump</strong>：起跳式動態開始</li>
</ul>

<h3>4. 創意與適應力</h3>
<p>每位選手可能用不同方式解決同一問題：</p>
<ul>
<li>身高優勢或劣勢的應對策略</li>
<li>發現定線員未預期的「非官方解法」</li>
<li>在嘗試中快速調整策略</li>
</ul>

<h2>傳奇選手</h2>

<h3>男子選手</h3>
<ul>
<li><strong>Tomoa Narasaki 楢﨑智亞（日本）</strong>：世界錦標賽與世界盃常勝軍，動態能力極強</li>
<li><strong>Mejdi Schalck（法國）</strong>：新生代抱石天才，創意解法令人驚嘆</li>
<li><strong>Yoshiyuki Ogata 緒方良行（日本）</strong>：技術全面的頂尖選手</li>
<li><strong>Adam Ondra（捷克）</strong>：雖以先鋒著稱，抱石實力同樣頂尖</li>
</ul>

<h3>女子選手</h3>
<ul>
<li><strong>Janja Garnbret（斯洛維尼亞）</strong>：統治級存在，抱石與先鋒雙冠王</li>
<li><strong>野中生萌 Miho Nonaka（日本）</strong>：東京奧運銀牌，爆發力驚人</li>
<li><strong>Oriane Bertone（法國）</strong>：新生代法國女將，2024 年表現亮眼</li>
<li><strong>Brooke Raboutou（美國）</strong>：美國抱石新星，技術細膩</li>
</ul>

<h2>抱石聖地</h2>

<h3>戶外抱石勝地</h3>
<ul>
<li><strong>楓丹白露（法國）</strong>：抱石運動的發源地，擁有數千條經典路線</li>
<li><strong>Rocklands（南非）</strong>：獨特的砂岩地形，風景壯麗</li>
<li><strong>Bishop（美國加州）</strong>：高海拔沙漠抱石天堂</li>
<li><strong>Magic Wood（瑞士）</strong>：森林中的花崗岩抱石區</li>
<li><strong>御岳（日本）</strong>：亞洲知名抱石聖地</li>
</ul>

<h3>室內賽事場地</h3>
<ul>
<li><strong>東京（日本）</strong>：2020 奧運場地</li>
<li><strong>巴黎（法國）</strong>：2024 奧運場地</li>
<li><strong>因斯布魯克（奧地利）</strong>：世界盃常設站點</li>
<li><strong>鹽湖城（美國）</strong>：北美攀岩重鎮</li>
</ul>

<h2>如何欣賞抱石比賽</h2>

<h3>觀賽重點</h3>
<ol>
<li><strong>觀察不同選手的解法差異</strong>：同一問題可能有多種解法</li>
<li><strong>注意嘗試次數</strong>：一次完成（Flash）最能展現實力</li>
<li><strong>感受選手的臨場調整</strong>：如何從失敗中修正策略</li>
<li><strong>欣賞動態動作的爆發力</strong>：Dyno 等動態技巧是一大看點</li>
</ol>

<h3>專業術語</h3>
<ul>
<li><strong>Flash</strong>：首次嘗試即完攀</li>
<li><strong>Beta</strong>：解題方式或攀爬訣竅</li>
<li><strong>Crimp</strong>：指尖抓握小岩點的方式</li>
<li><strong>Sloper</strong>：圓滑無明顯抓握點的岩點</li>
<li><strong>Heel Hook / Toe Hook</strong>：用腳跟或腳尖勾住岩點</li>
<li><strong>Campus</strong>：不使用腳的純手臂攀爬</li>
<li><strong>Mantle</strong>：撐上平台的動作</li>
</ul>

<h2>為何抱石如此受歡迎</h2>
<ul>
<li><strong>入門門檻低</strong>：不需要繩索確保知識，適合新手</li>
<li><strong>社交性強</strong>：岩友可以一起討論解法、互相鼓勵</li>
<li><strong>即時滿足感</strong>：問題短，成功完攀的成就感來得快</li>
<li><strong>觀賞性高</strong>：動作戲劇性強，適合現場觀看與直播</li>
<li><strong>訓練效率高</strong>：短時間內可以嘗試多條路線</li>
</ul>

<h2>結語</h2>
<p>抱石是攀岩運動中最具創意與爆發力的項目，每一個「問題」都是一道獨特的謎題，等待選手用身體去解答。無論是在戶外的天然岩石上，還是在室內的人工岩壁前，抱石都能帶來獨特的樂趣與挑戰。隨著攀岩運動持續普及，抱石也將吸引更多人體驗這項結合力量、技巧與智慧的運動！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.ifsc-climbing.org/" target="_blank" rel="noopener noreferrer">IFSC 官方網站</a></li>
<li><a href="https://en.wikipedia.org/wiki/Bouldering" target="_blank" rel="noopener noreferrer">Wikipedia - Bouldering</a></li>
<li><a href="https://www.climbing.com/" target="_blank" rel="noopener noreferrer">Climbing Magazine</a></li>
<li><a href="https://www.fontainebleau.co/" target="_blank" rel="noopener noreferrer">Fontainebleau Bouldering</a></li>
</ul>',
  NULL,
  'competition',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_bouldering', '抱石');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_bouldering', '比賽規則');
INSERT INTO post_tags (post_id, tag) VALUES ('post_competition_bouldering', '選手');
