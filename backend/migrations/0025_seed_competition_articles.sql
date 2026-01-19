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
<li><strong>岩壁高度</strong>：15 公尺以上（世界盃標準）</li>
<li><strong>路線長度</strong>：約 15 公尺</li>
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

<h3>波蘭</h3>
<p>波蘭在女子速度攀岩領域稱霸全球：</p>
<ul>
<li>Aleksandra Miroslaw 的故鄉，女子速度攀岩世界紀錄保持人（6.06 秒）</li>
<li>2024 巴黎奧運女子速度金牌得主</li>
<li>國內速度攀岩培訓體系發達</li>
</ul>

<h3>英國 - BMC</h3>
<p>英國擁有悠久的登山與攀岩傳統：</p>
<ul>
<li>BMC（British Mountaineering Council）負責管理攀岩運動</li>
<li>Toby Roberts 在 2024 巴黎奧運奪得男子複合賽金牌</li>
<li>峰區（Peak District）等地是著名的戶外攀岩勝地</li>
<li>近年競技攀岩實力大幅提升</li>
</ul>

<h3>西班牙 - FEDME</h3>
<p>西班牙是攀岩運動的熱門目的地：</p>
<ul>
<li>FEDME（Federación Española de Deportes de Montaña y Escalada）管理攀岩運動</li>
<li>Alberto Ginés López 在 2020 東京奧運奪得男子三項全能金牌</li>
<li>擁有眾多世界級戶外攀岩場地，如 Siurana、El Chorro</li>
<li>溫暖氣候吸引全球攀岩者前往訓練</li>
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

<h3>巴黎 2024 金牌得主</h3>
<ul>
<li><strong>男子速度攀岩</strong>：Veddriq Leonardo（印尼）</li>
<li><strong>女子速度攀岩</strong>：Aleksandra Miroslaw（波蘭）</li>
<li><strong>男子抱石與先鋒複合賽</strong>：Toby Roberts（英國）</li>
<li><strong>女子抱石與先鋒複合賽</strong>：Janja Garnbret（斯洛維尼亞）</li>
</ul>
<p>Janja Garnbret 在巴黎奧運成功衛冕，延續她在東京奧運的統治地位；Aleksandra Miroslaw 則以破世界紀錄的 6.06 秒奪得女子速度金牌。</p>

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
<li><strong>岩壁高度</strong>：15 公尺以上</li>
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

-- 5. 先鋒攀登深度介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_competition_lead_climbing',
  'nobodyclimb_staff_account_001',
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
  'nobodyclimb_staff_account_001',
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
