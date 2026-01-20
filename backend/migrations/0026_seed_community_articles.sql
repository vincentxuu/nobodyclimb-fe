-- Seed community blog posts
-- Author: nobodyclimb (staff account)
-- Date: 2026-01-20
-- Category: community (社群與文化)

-- Note: nobodyclimb staff user already created in migration 0025

-- 1. 經典攀岩電影與紀錄片推薦
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_climbing_films',
  'nobodyclimb_staff_account_001',
  '經典攀岩電影與紀錄片推薦',
  'classic-climbing-films-documentaries',
  '從《乘光攀行》到《乘光》，精選影響攀岩文化的經典紀錄片與電影，帶你深入了解攀岩者的內心世界與挑戰精神。',
  '<h2>前言</h2>
<p>攀岩紀錄片是認識這項運動最直接的方式之一。透過鏡頭，我們能近距離感受攀岩者面對極限時的勇氣、恐懼與堅持。本文精選近年最具影響力的攀岩電影與紀錄片，帶你進入攀岩者的世界。</p>

<h2>必看紀錄片</h2>

<h3>1. Free Solo《乘光攀行》（2018）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Elizabeth Chai Vasarhelyi、Jimmy Chin</li>
<li><strong>主角</strong>：Alex Honnold</li>
<li><strong>片長</strong>：100 分鐘</li>
<li><strong>獎項</strong>：2019 年奧斯卡最佳紀錄片獎</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>記錄 Alex Honnold 於 2017 年 6 月 3 日無繩獨攀優勝美地酋長岩（El Capitan）的歷史性壯舉。這條名為 Freerider 的路線全長約 900 公尺，Honnold 在 3 小時 56 分鐘內完成，創下人類攀岩史上最偉大的成就之一。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>奧斯卡金像獎肯定，製作水準極高</li>
<li>深入探討 Honnold 的心理狀態與訓練過程</li>
<li>攝影團隊本身就是頂尖攀岩者，拍攝角度令人屏息</li>
<li>不僅是攀岩紀錄片，更是探討人類極限的深度作品</li>
</ul>
<p><strong>觀看平台</strong>：Disney+、National Geographic</p>

<h3>2. The Dawn Wall《乘光》（2017）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Josh Lowell、Peter Mortimer</li>
<li><strong>主角</strong>：Tommy Caldwell、Kevin Jorgeson</li>
<li><strong>片長</strong>：100 分鐘</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>記錄 Tommy Caldwell 與 Kevin Jorgeson 於 2015 年 1 月首次自由攀登酋長岩 Dawn Wall 路線的 19 天歷程。這條被認為是世界上最難的大岩壁路線，難度高達 5.14d（32 個繩距），兩人的堅持感動全球。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>Tommy Caldwell 的人生故事極具啟發性（曾被綁架、失去一根手指）</li>
<li>展現團隊合作與永不放棄的精神</li>
<li>攀登過程的戲劇性令人揪心</li>
<li>完美詮釋「不可能」如何被克服</li>
</ul>
<p><strong>觀看平台</strong>：Netflix、Amazon Prime Video</p>

<h3>3. The Alpinist《高山上的攀登者》（2021）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Peter Mortimer、Nick Rosen</li>
<li><strong>主角</strong>：Marc-André Leclerc</li>
<li><strong>片長</strong>：93 分鐘</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>記錄加拿大登山家 Marc-André Leclerc 的傳奇故事。Leclerc 以獨攀冬季高山路線聞名，他刻意避開媒體關注，在荒野中進行最純粹的攀登。2018 年，他在阿拉斯加的一次攀登中不幸罹難，年僅 25 歲。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>呈現最純粹的登山精神</li>
<li>Leclerc 的謙遜與對攀登的熱愛令人動容</li>
<li>壯麗的高山攝影</li>
<li>引發對風險與熱情的深刻思考</li>
</ul>
<p><strong>觀看平台</strong>：Netflix、Amazon Prime Video</p>

<h3>4. Valley Uprising《優勝美地起義》（2014）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Peter Mortimer、Nick Rosen</li>
<li><strong>片長</strong>：101 分鐘</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>講述優勝美地國家公園 50 年來的攀岩歷史，從 1950 年代的先驅者到現代的極限攀登。涵蓋 Royal Robbins、Warren Harding、Lynn Hill、Tommy Caldwell、Alex Honnold 等傳奇人物的故事。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>了解攀岩文化演進的必看之作</li>
<li>珍貴的歷史影像資料</li>
<li>生動呈現不同世代攀岩者的風格與衝突</li>
<li>配樂與剪輯節奏極佳</li>
</ul>
<p><strong>觀看平台</strong>：Amazon Prime Video、Red Bull TV</p>

<h3>5. Reel Rock 系列</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>製作</strong>：Sender Films、Big UP Productions</li>
<li><strong>形式</strong>：年度攀岩電影合輯，每年發行</li>
<li><strong>歷史</strong>：自 2006 年開始，已發行超過 17 集</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>Reel Rock 是攀岩界最知名的年度影展，每年精選 3-5 部短片，涵蓋競技攀岩、傳統攀登、抱石等各種主題。許多經典紀錄片（如 Free Solo）最初都是從 Reel Rock 短片發展而來。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>了解當年攀岩界最重要事件的最佳管道</li>
<li>短片形式，輕鬆觀看</li>
<li>涵蓋各種攀岩類型</li>
<li>每年巡迴放映，可參加現場活動</li>
</ul>
<p><strong>觀看平台</strong>：reelrocktour.com、Vimeo 租借</p>

<h2>競技攀岩紀錄片</h2>

<h3>6. Janja Garnbret: The Wall《Janja：牆的故事》</h3>
<p><strong>內容簡介</strong></p>
<p>記錄斯洛維尼亞攀岩女王 Janja Garnbret 的崛起之路。從 13 歲贏得歐洲青少年錦標賽，到成為史上最成功的競技攀岩選手，Garnbret 的統治力無人能及。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>了解當代最強女子攀岩選手</li>
<li>展現競技攀岩的訓練與心理準備</li>
<li>適合對競技攀岩有興趣的觀眾</li>
</ul>

<h3>7. Age of Ondra《Ondra 的時代》（2017）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Petr Pavlíček</li>
<li><strong>主角</strong>：Adam Ondra</li>
<li><strong>片長</strong>：75 分鐘</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>記錄捷克攀岩天才 Adam Ondra 的成長歷程與攀登成就。影片涵蓋他創造歷史的時刻，包括成為首位完攀 9c 難度路線 Silence 的攀岩者。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>深入了解被譽為「史上最強」的攀岩者</li>
<li>見證攀岩難度極限的突破</li>
<li>Ondra 獨特的攀爬風格與訓練方法</li>
</ul>
<p><strong>觀看平台</strong>：Vimeo 租借</p>

<h2>經典老片</h2>

<h3>8. Touching the Void《乘光攀行》（2003）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Kevin Macdonald</li>
<li><strong>原著</strong>：Joe Simpson 同名著作</li>
<li><strong>片長</strong>：106 分鐘</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>改編自 Joe Simpson 的真實經歷。1985 年，Simpson 與 Simon Yates 攀登秘魯安地斯山脈的 Siula Grande 峰時發生意外，Simpson 摔斷腿後被繩伴 Yates 割斷繩索墜入冰隙，卻奇蹟般獨自爬回營地。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>登山紀錄片經典中的經典</li>
<li>探討極端環境下的道德抉擇</li>
<li>人類求生意志的極致展現</li>
</ul>

<h3>9. King Lines（2007）</h3>
<p><strong>內容簡介</strong></p>
<p>記錄 Chris Sharma 挑戰世界最難路線的歷程，包括他在西班牙 Céüse 完攀 Realization（5.15a）等歷史性攀登。</p>
<p><strong>推薦理由</strong></p>
<ul>
<li>認識 Chris Sharma 這位傳奇攀岩者</li>
<li>見證 2000 年代攀岩難度的突破</li>
<li>經典的攀岩攝影與剪輯</li>
</ul>

<h2>觀影指南</h2>

<h3>依程度選擇</h3>
<ul>
<li><strong>入門者</strong>：Free Solo、The Dawn Wall（故事性強，易於理解）</li>
<li><strong>進階者</strong>：Valley Uprising、Age of Ondra（需要一些攀岩知識）</li>
<li><strong>資深愛好者</strong>：Reel Rock 系列、King Lines（更專業的內容）</li>
</ul>

<h3>依興趣選擇</h3>
<ul>
<li><strong>喜歡驚險刺激</strong>：Free Solo、The Alpinist</li>
<li><strong>喜歡人物故事</strong>：The Dawn Wall、Age of Ondra</li>
<li><strong>對攀岩歷史有興趣</strong>：Valley Uprising</li>
<li><strong>對競技攀岩有興趣</strong>：Janja Garnbret: The Wall</li>
</ul>

<h2>結語</h2>
<p>攀岩紀錄片不只是記錄攀登過程，更是探討人類如何面對恐懼、挑戰極限、追求夢想的故事。無論你是否攀岩，這些影片都能帶來深刻的啟發與感動。找一個週末，挑一部開始看吧！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.imdb.com/title/tt7775622/" target="_blank" rel="noopener noreferrer">IMDb - Free Solo</a></li>
<li><a href="https://www.imdb.com/title/tt7286916/" target="_blank" rel="noopener noreferrer">IMDb - The Dawn Wall</a></li>
<li><a href="https://www.imdb.com/title/tt11790780/" target="_blank" rel="noopener noreferrer">IMDb - The Alpinist</a></li>
<li><a href="https://www.imdb.com/title/tt3784160/" target="_blank" rel="noopener noreferrer">IMDb - Valley Uprising</a></li>
<li><a href="https://www.reelrocktour.com/" target="_blank" rel="noopener noreferrer">Reel Rock Tour 官網</a></li>
<li><a href="https://en.wikipedia.org/wiki/Free_Solo" target="_blank" rel="noopener noreferrer">Wikipedia - Free Solo</a></li>
<li><a href="https://en.wikipedia.org/wiki/The_Dawn_Wall_(film)" target="_blank" rel="noopener noreferrer">Wikipedia - The Dawn Wall</a></li>
<li><a href="https://www.climbing.com/culture/best-climbing-movies-all-time/" target="_blank" rel="noopener noreferrer">Climbing Magazine - Best Climbing Movies</a></li>
</ul>',
  NULL,
  'community',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', '紀錄片');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', '電影');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', '攀岩文化');

-- 2. 當代最強攀岩選手介紹
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_top_climbers',
  'nobodyclimb_staff_account_001',
  '當代最強攀岩選手介紹',
  'top-climbers-of-modern-era',
  '從 Adam Ondra 到 Janja Garnbret，認識當今攀岩界最頂尖的選手，了解他們的成就、風格與對這項運動的貢獻。',
  '<h2>前言</h2>
<p>攀岩運動在過去十年經歷了前所未有的發展，選手們不斷突破人類極限，創造歷史。本文介紹當代最具影響力的攀岩選手，帶你認識這些正在書寫攀岩歷史的傳奇人物。</p>

<h2>男子選手</h2>

<h3>Adam Ondra（捷克）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1993 年 2 月 5 日</li>
<li><strong>國籍</strong>：捷克</li>
<li><strong>身高</strong>：185 公分</li>
<li><strong>專長</strong>：先鋒攀登、抱石</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>史上首位完攀 9c 難度路線（Silence，2017 年）</li>
<li>4 屆世界錦標賽冠軍（先鋒 2 次、抱石 2 次）</li>
<li>史上唯一在同一年贏得先鋒與抱石世錦賽雙冠軍的男選手（2014 年）</li>
<li>完攀超過 180 條 9a 及以上難度路線</li>
<li>2020 東京奧運參賽選手</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Ondra 以獨特的攀爬方式聞名，包括在困難動作時發出的標誌性喊叫聲。他的技術極為全面，無論是需要指力的小點路線還是需要爆發力的動態動作，都能完美應對。</p>
<p><strong>代表作品</strong></p>
<ul>
<li>Silence（9c，世界首攀，2017）</li>
<li>Change（9b+，世界首攀，2012）</li>
<li>Disbelief（9b，2024）</li>
</ul>

<h3>Jakob Schubert（奧地利）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1990 年 12 月 31 日</li>
<li><strong>國籍</strong>：奧地利</li>
<li><strong>專長</strong>：先鋒攀登</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>3 屆世界錦標賽先鋒冠軍</li>
<li>多屆世界盃總冠軍</li>
<li>2020 東京奧運銅牌</li>
<li>完攀多條 9b+ 難度路線</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Schubert 是競技攀岩中最穩定的選手之一，技術細膩、心理素質極強。他在重大比賽中的發揮總是令人信賴。</p>

<h3>Tomoa Narasaki 楢﨑智亞（日本）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1996 年 6 月 22 日</li>
<li><strong>國籍</strong>：日本</li>
<li><strong>專長</strong>：抱石、複合賽</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2 屆世界錦標賽抱石冠軍（2016、2019）</li>
<li>多屆抱石世界盃總冠軍</li>
<li>2020 東京奧運銅牌</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>楢﨑智亞以驚人的動態能力著稱，他的協調跳躍（Coordination）動作是比賽中的一大看點。作為日本攀岩的代表人物，他推動了競技攀岩在亞洲的發展。</p>

<h3>Stefano Ghisolfi（義大利）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1993 年 6 月 16 日</li>
<li><strong>國籍</strong>：義大利</li>
<li><strong>專長</strong>：先鋒攀登（戶外與競技）</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2021 世界盃先鋒總冠軍</li>
<li>6 座世界盃分站冠軍</li>
<li>完攀多條 9b+ 難度路線</li>
<li>義大利攀岩紀錄保持人</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Ghisolfi 是少數在戶外攀岩與競技攀岩都達到頂尖水準的選手，他的耐力和路線閱讀能力極強。</p>

<h3>Sam Watson（美國）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：2004 年</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>專長</strong>：速度攀岩</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>男子速度攀岩世界紀錄保持人（4.64 秒，2025 年）</li>
<li>首位突破 4.7 秒的選手</li>
<li>美國速度攀岩新生代領袖</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Watson 代表美國速度攀岩的崛起，年僅 20 歲就打破世界紀錄，展現驚人的天賦與潛力。</p>

<h2>女子選手</h2>

<h3>Janja Garnbret（斯洛維尼亞）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1999 年 3 月 12 日</li>
<li><strong>國籍</strong>：斯洛維尼亞</li>
<li><strong>身高</strong>：164 公分</li>
<li><strong>專長</strong>：先鋒攀登、抱石</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2 屆奧運金牌（2020 東京、2024 巴黎）</li>
<li>8 屆世界錦標賽冠軍</li>
<li>6 屆世界盃總冠軍</li>
<li>史上最成功的女子攀岩選手</li>
<li>斯洛維尼亞最高體育榮譽 Bloudek 獎得主</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Garnbret 的統治力在攀岩界前所未見。她 7 歲開始攀岩，13 歲贏得歐洲青少年錦標賽。她的技術極為全面，無論是先鋒還是抱石都是世界頂尖。更重要的是，她在比賽中幾乎從不失誤，心理素質極強。</p>
<p><strong>歷史地位</strong></p>
<p>Garnbret 被普遍認為是史上最偉大的競技攀岩選手，沒有之一。她在 2024 年巴黎奧運成功衛冕，進一步鞏固了她的傳奇地位。</p>

<h3>Aleksandra Miroslaw（波蘭）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1994 年 7 月 18 日</li>
<li><strong>國籍</strong>：波蘭</li>
<li><strong>專長</strong>：速度攀岩</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>女子速度攀岩世界紀錄保持人（6.06 秒）</li>
<li>2024 巴黎奧運女子速度金牌</li>
<li>多屆世界盃速度冠軍</li>
<li>連續多年打破自己的世界紀錄</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Miroslaw 是女子速度攀岩的絕對統治者，她不斷挑戰自己的極限，將世界紀錄一再推進。她在巴黎奧運決賽中破紀錄奪冠，展現了驚人的實力。</p>

<h3>Ai Mori 森秋彩（日本）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：2003 年 1 月 12 日</li>
<li><strong>國籍</strong>：日本</li>
<li><strong>專長</strong>：先鋒攀登、抱石</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2024 巴黎奧運複合賽銀牌</li>
<li>多屆世界盃獎牌得主</li>
<li>日本新生代頂尖選手</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>森秋彩身材嬌小但技術細膩，是少數能與 Garnbret 競爭的選手之一。她在 2024 巴黎奧運的表現令人印象深刻。</p>

<h3>Brooke Raboutou（美國）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：2001 年 3 月 10 日</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>專長</strong>：抱石、先鋒攀登</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2024 巴黎奧運複合賽銅牌</li>
<li>多屆青少年世界冠軍</li>
<li>美國女子攀岩代表人物</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Raboutou 出身攀岩世家（父母都是職業攀岩者），從小就展現驚人天賦。她的抱石技術特別出色，動作細膩優雅。</p>

<h3>Jessica Pilz（奧地利）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1997 年 6 月 22 日</li>
<li><strong>國籍</strong>：奧地利</li>
<li><strong>專長</strong>：先鋒攀登</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2 屆世界錦標賽先鋒冠軍</li>
<li>多屆世界盃獎牌得主</li>
<li>奧地利女子攀岩代表</li>
</ul>
<p><strong>攀爬風格</strong></p>
<p>Pilz 是先鋒攀登專項選手，她的耐力和路線閱讀能力在女子選手中首屈一指。</p>

<h2>傳奇先驅</h2>

<h3>Alex Honnold（美國）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1985 年 8 月 17 日</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>專長</strong>：無繩獨攀（Free Solo）、大岩壁攀登</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2017 年無繩獨攀酋長岩 Freerider 路線（3 小時 56 分）</li>
<li>紀錄片《Free Solo》獲奧斯卡最佳紀錄片</li>
<li>多項大岩壁速度紀錄</li>
</ul>
<p><strong>歷史地位</strong></p>
<p>Honnold 的酋長岩無繩獨攀被認為是人類攀岩史上最偉大的成就之一。他獨特的心理素質和風險管理能力使他成為傳奇。</p>

<h3>Tommy Caldwell（美國）</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1978 年 8 月 11 日</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>專長</strong>：大岩壁攀登、傳統攀登</li>
</ul>
<p><strong>主要成就</strong></p>
<ul>
<li>2015 年首次自由攀登酋長岩 Dawn Wall</li>
<li>多項酋長岩速度紀錄</li>
<li>即使失去一根手指仍達到世界頂尖水準</li>
</ul>
<p><strong>歷史地位</strong></p>
<p>Caldwell 的堅持精神是攀岩界的典範。他克服了被綁架的創傷、失去手指的困境，最終完成了被認為不可能的 Dawn Wall。</p>

<h2>結語</h2>
<p>這些頂尖選手不僅在攀岩成績上創造歷史，更透過他們的故事激勵無數人挑戰自我、追求夢想。隨著攀岩運動持續發展，相信會有更多優秀選手湧現，讓我們一起期待攀岩運動更精彩的未來！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.ifsc-climbing.org/athletes" target="_blank" rel="noopener noreferrer">IFSC 選手資料庫</a></li>
<li><a href="https://en.wikipedia.org/wiki/Adam_Ondra" target="_blank" rel="noopener noreferrer">Wikipedia - Adam Ondra</a></li>
<li><a href="https://en.wikipedia.org/wiki/Janja_Garnbret" target="_blank" rel="noopener noreferrer">Wikipedia - Janja Garnbret</a></li>
<li><a href="https://en.wikipedia.org/wiki/Alex_Honnold" target="_blank" rel="noopener noreferrer">Wikipedia - Alex Honnold</a></li>
<li><a href="https://en.wikipedia.org/wiki/Tommy_Caldwell" target="_blank" rel="noopener noreferrer">Wikipedia - Tommy Caldwell</a></li>
<li><a href="https://en.wikipedia.org/wiki/Aleksandra_Miroslaw" target="_blank" rel="noopener noreferrer">Wikipedia - Aleksandra Miroslaw</a></li>
<li><a href="https://olympics.com/en/paris-2024/results/sport-climbing" target="_blank" rel="noopener noreferrer">Paris 2024 Olympics - Sport Climbing Results</a></li>
<li><a href="https://www.climbing.com/people/best-climbers-world-2024/" target="_blank" rel="noopener noreferrer">Climbing Magazine - Best Climbers 2024</a></li>
</ul>',
  NULL,
  'community',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', '選手');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', '攀岩名人');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', '攀岩文化');

-- 3. 攀岩運動發展史
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_climbing_history',
  'nobodyclimb_staff_account_001',
  '攀岩運動發展史：從登山附屬到奧運項目',
  'history-of-rock-climbing',
  '從 19 世紀的登山訓練到 2024 年巴黎奧運，攀岩運動經歷了怎樣的演變？本文帶你回顧攀岩運動的百年發展歷程。',
  '<h2>前言</h2>
<p>攀岩運動從最初作為登山訓練的附屬活動，發展成為獨立的奧運項目，經歷了超過一個世紀的演變。本文將帶你回顧這段精彩的歷史，認識那些推動攀岩運動發展的關鍵人物與里程碑事件。</p>

<h2>起源時期（19 世紀末 - 1950 年代）</h2>

<h3>登山運動的附屬</h3>
<p>攀岩最初是作為登山訓練的一部分而發展起來的：</p>
<ul>
<li><strong>1880 年代</strong>：英國湖區開始有系統的岩石攀登活動</li>
<li><strong>1886 年</strong>：Walter Parry Haskett Smith 獨自攀登 Napes Needle，被認為是運動攀岩的起點</li>
<li><strong>1890 年代</strong>：德國薩克森地區發展出早期的攀岩技術與規則</li>
</ul>

<h3>楓丹白露的抱石傳統</h3>
<p>法國楓丹白露（Fontainebleau）是抱石運動的發源地：</p>
<ul>
<li><strong>1900 年代初</strong>：巴黎的登山者開始在楓丹白露的砂岩上練習</li>
<li><strong>1930 年代</strong>：Pierre Allain 等先驅者發展出系統化的抱石訓練方法</li>
<li><strong>1950 年代</strong>：楓丹白露已成為歐洲最重要的攀岩訓練場地</li>
</ul>

<h2>優勝美地時代（1950 年代 - 1970 年代）</h2>

<h3>美國攀岩的崛起</h3>
<p>優勝美地國家公園成為現代攀岩的聖地：</p>
<ul>
<li><strong>1957 年</strong>：Royal Robbins、Jerry Gallwas、Mike Sherrick 首次攀登 Half Dome 的西北壁</li>
<li><strong>1958 年</strong>：Warren Harding 完成酋長岩 The Nose 路線的首攀（歷時 47 天）</li>
<li><strong>1960 年代</strong>：「乾淨攀登」運動興起，減少對岩壁的破壞</li>
</ul>

<h3>關鍵人物</h3>
<ul>
<li><strong>Royal Robbins</strong>：倡導乾淨攀登，強調攀岩倫理</li>
<li><strong>Warren Harding</strong>：開創大岩壁攀登新紀元</li>
<li><strong>Yvon Chouinard</strong>：攀岩裝備革命的推動者，後創立 Patagonia</li>
</ul>

<h2>自由攀登革命（1970 年代 - 1980 年代）</h2>

<h3>從器械攀登到自由攀登</h3>
<p>攀岩理念發生根本性轉變：</p>
<ul>
<li><strong>器械攀登（Aid Climbing）</strong>：依靠岩釘、繩梯等器械向上移動</li>
<li><strong>自由攀登（Free Climbing）</strong>：僅用手腳接觸岩石攀爬，器械只用於保護</li>
</ul>

<h3>里程碑事件</h3>
<ul>
<li><strong>1979 年</strong>：Ray Jardine 完成 Phoenix（5.13a），推進難度上限</li>
<li><strong>1983 年</strong>：Alan Watts 使用現代膠鞋攀爬，改變了攀岩技術</li>
<li><strong>1988 年</strong>：Wolfgang Güllich 完成 Action Directe（5.14d），開創新時代</li>
</ul>

<h3>Lynn Hill 的歷史性突破</h3>
<p><strong>1993 年</strong>，美國女性攀岩者 Lynn Hill 完成酋長岩 The Nose 的首次自由攀登，這是攀岩史上最偉大的成就之一。她在 1994 年更以一天內完成這條路線，證明了女性在攀岩領域的無限可能。</p>

<h2>競技攀岩興起（1980 年代 - 2000 年代）</h2>

<h3>室內攀岩與比賽</h3>
<ul>
<li><strong>1985 年</strong>：義大利巴乾涅舉辦首場國際先鋒攀登比賽</li>
<li><strong>1989 年</strong>：首屆世界盃在法國舉行</li>
<li><strong>1991 年</strong>：首屆世界錦標賽舉辦</li>
<li><strong>1998 年</strong>：抱石成為獨立的比賽項目</li>
</ul>

<h3>IFSC 成立</h3>
<p><strong>2007 年</strong>，國際運動攀登總會（International Federation of Sport Climbing，IFSC）正式成立，統一管理全球競技攀岩運動，為攀岩進入奧運鋪路。</p>

<h2>難度極限突破（2000 年代 - 2020 年代）</h2>

<h3>9a 到 9c 的演進</h3>
<table>
<tr><th>年份</th><th>難度</th><th>路線</th><th>選手</th></tr>
<tr><td>2001</td><td>9a+</td><td>Biographie</td><td>Chris Sharma</td></tr>
<tr><td>2008</td><td>9b</td><td>Jumbo Love</td><td>Chris Sharma</td></tr>
<tr><td>2012</td><td>9b+</td><td>Change</td><td>Adam Ondra</td></tr>
<tr><td>2017</td><td>9c</td><td>Silence</td><td>Adam Ondra</td></tr>
</table>
<p>Adam Ondra 在 2017 年完攀 Silence（9c），是目前公認世界上最難的路線，代表人類攀岩能力的極限。</p>

<h3>抱石難度突破</h3>
<ul>
<li><strong>2016 年</strong>：Nalle Hukkataival 完成 Burden of Dreams（V17/8C+），世界首條 V17</li>
<li><strong>2021 年</strong>：Daniel Woods、Shawn Raboutou 等選手重複完攀，確認難度</li>
</ul>

<h2>奧運時代（2016 年至今）</h2>

<h3>進入奧運</h3>
<ul>
<li><strong>2016 年</strong>：國際奧委會宣布將攀岩納入 2020 東京奧運</li>
<li><strong>2021 年</strong>：攀岩首次在奧運亮相（因疫情延期一年）</li>
<li><strong>2024 年</strong>：巴黎奧運，賽制改革（速度獨立、複合賽）</li>
</ul>

<h3>奧運金牌得主</h3>
<p><strong>2020 東京奧運</strong></p>
<ul>
<li>男子三項全能：Alberto Ginés López（西班牙）</li>
<li>女子三項全能：Janja Garnbret（斯洛維尼亞）</li>
</ul>
<p><strong>2024 巴黎奧運</strong></p>
<ul>
<li>男子速度：Veddriq Leonardo（印尼）</li>
<li>女子速度：Aleksandra Miroslaw（波蘭）</li>
<li>男子複合賽：Toby Roberts（英國）</li>
<li>女子複合賽：Janja Garnbret（斯洛維尼亞）</li>
</ul>

<h2>攀岩在台灣</h2>

<h3>發展歷程</h3>
<ul>
<li><strong>1980 年代</strong>：攀岩運動開始傳入台灣</li>
<li><strong>1990 年代</strong>：龍洞成為台灣最重要的戶外攀岩場地</li>
<li><strong>2000 年代</strong>：室內攀岩館開始普及</li>
<li><strong>2010 年代</strong>：抱石館蓬勃發展，攀岩人口快速成長</li>
<li><strong>2020 年代</strong>：因奧運效應，攀岩熱潮達到高峰</li>
</ul>

<h3>重要場地</h3>
<ul>
<li><strong>龍洞</strong>：台灣最知名的戶外攀岩場地，擁有豐富的海蝕岩壁</li>
<li><strong>關子嶺</strong>：南部重要的戶外攀岩區域</li>
<li><strong>各地抱石館</strong>：台北、台中、高雄等城市都有多家專業抱石館</li>
</ul>

<h3>台灣攀岩協會</h3>
<p>中華民國山岳協會（CTAA）負責管理台灣的競技攀岩運動，舉辦全國錦標賽並選拔國家代表隊參加國際賽事。</p>

<h2>未來展望</h2>

<h3>攀岩運動的趨勢</h3>
<ul>
<li><strong>人口成長</strong>：預估全球攀岩人口將持續增加</li>
<li><strong>商業化發展</strong>：更多連鎖攀岩館興起</li>
<li><strong>媒體曝光</strong>：因奧運效應，攀岩獲得更多關注</li>
<li><strong>科技應用</strong>：訓練數據分析、VR 攀岩等新科技</li>
</ul>

<h3>2028 洛杉磯奧運</h3>
<p>攀岩將繼續作為奧運項目，預期會維持巴黎賽制。洛杉磯作為攀岩重鎮，屆時的比賽將備受關注。</p>

<h2>結語</h2>
<p>從 19 世紀的登山訓練到 21 世紀的奧運項目，攀岩運動經歷了翻天覆地的變化。這項運動不僅考驗體能與技術，更體現了人類挑戰極限、追求自我突破的精神。隨著攀岩持續發展，相信會有更多精彩的故事等待我們去見證。</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://en.wikipedia.org/wiki/History_of_rock_climbing" target="_blank" rel="noopener noreferrer">Wikipedia - History of Rock Climbing</a></li>
<li><a href="https://www.climbing.com/culture/a-brief-history-of-climbing/" target="_blank" rel="noopener noreferrer">Climbing Magazine - A Brief History of Climbing</a></li>
<li><a href="https://www.ifsc-climbing.org/about" target="_blank" rel="noopener noreferrer">IFSC - About</a></li>
<li><a href="https://en.wikipedia.org/wiki/Yosemite_climbing" target="_blank" rel="noopener noreferrer">Wikipedia - Yosemite Climbing</a></li>
<li><a href="https://en.wikipedia.org/wiki/Lynn_Hill" target="_blank" rel="noopener noreferrer">Wikipedia - Lynn Hill</a></li>
<li><a href="https://en.wikipedia.org/wiki/Adam_Ondra" target="_blank" rel="noopener noreferrer">Wikipedia - Adam Ondra</a></li>
<li><a href="https://olympics.com/en/sports/sport-climbing/" target="_blank" rel="noopener noreferrer">Olympics.com - Sport Climbing</a></li>
<li><a href="https://www.climbing.org.tw/" target="_blank" rel="noopener noreferrer">中華民國山岳協會</a></li>
</ul>',
  NULL,
  'community',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '攀岩歷史');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '攀岩文化');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '運動發展');

-- 4. 攀岩必讀書籍推薦
INSERT INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_climbing_books',
  'nobodyclimb_staff_account_001',
  '攀岩必讀書籍推薦',
  'must-read-climbing-books',
  '從《攀岩聖經》到《The Rock Warrior''s Way》，精選技術訓練、心理建設與攀岩故事類書籍，助你從閱讀中提升攀岩實力。',
  '<h2>前言</h2>
<p>攀岩不只是身體的運動，更是心智的修煉。透過閱讀，我們能學習前人的智慧、了解訓練方法、培養正確心態。本文精選技術訓練、心理建設、傳記故事三大類書籍，無論你是初學者還是進階攀岩者，都能從中獲益。</p>

<h2>繁體中文書籍</h2>

<h3>一攀就上手：基礎攀岩一次就學會</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：李虹瑩</li>
<li><strong>出版社</strong>：墨刻</li>
<li><strong>出版年份</strong>：2022 年</li>
<li><strong>ISBN</strong>：9789862898314</li>
<li><strong>頁數</strong>：約 200 頁</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>這是一本專為台灣讀者撰寫的入門攀岩書籍。作者李虹瑩是台灣頂尖攀岩選手，曾代表台灣參加多項國際賽事。書中涵蓋：</p>
<ul>
<li>攀岩基礎知識與安全觀念</li>
<li>抱石與上攀的基本技術</li>
<li>裝備選購指南</li>
<li>台灣攀岩場地介紹</li>
<li>訓練方法與進階技巧</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>繁體中文原創，閱讀流暢無翻譯障礙</li>
<li>內容貼近台灣攀岩環境</li>
<li>由頂尖選手撰寫，專業可靠</li>
<li>圖文並茂，適合初學者</li>
</ul>
<p><strong>適合讀者</strong>：完全新手、想了解台灣攀岩的讀者</p>

<h3>攀岩聖經（How to Climb 5.12）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Eric J. Hörst</li>
<li><strong>譯者</strong>：謝伊伶</li>
<li><strong>出版社</strong>：臉譜</li>
<li><strong>ISBN</strong>：9789862358153</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>這是攀岩訓練領域的經典之作，原著《How to Climb 5.12》被翻譯成多國語言。內容涵蓋：</p>
<ul>
<li>攀岩體能訓練的科學原理</li>
<li>力量與耐力的平衡發展</li>
<li>心理訓練與恐懼克服</li>
<li>受傷預防與恢復</li>
<li>訓練計畫的設計</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>台灣少數有中文翻譯的經典攀岩書</li>
<li>內容紮實且經過時間考驗</li>
<li>適合想系統性提升的攀岩者</li>
</ul>
<p><strong>適合讀者</strong>：中階攀岩者（穩定爬 5.10-5.11）、想突破瓶頸的愛好者</p>

<h2>英文技術書籍</h2>

<h3>Training for Climbing（第四版）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Eric J. Hörst</li>
<li><strong>出版社</strong>：Falcon Guides</li>
<li><strong>出版年份</strong>：2022 年（第四版）</li>
<li><strong>頁數</strong>：384 頁</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>這是《攀岩聖經》的進階版本，內容更新、更完整：</p>
<ul>
<li>最新的運動科學研究應用</li>
<li>詳細的力量訓練方法</li>
<li>耐力與恢復的科學原理</li>
<li>營養與睡眠對表現的影響</li>
<li>完整的訓練週期規劃</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>攀岩訓練領域的權威著作</li>
<li>結合最新運動科學研究</li>
<li>詳細的訓練計畫範例</li>
<li>比中譯版更新、更完整</li>
</ul>
<p><strong>適合讀者</strong>：認真訓練的中高階攀岩者、攀岩教練</p>

<h3>The Rock Warrior''s Way</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Arno Ilgner</li>
<li><strong>出版社</strong>：Desiderata Institute</li>
<li><strong>出版年份</strong>：2003 年</li>
<li><strong>頁數</strong>：192 頁</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>這是一本探討攀岩心理學的經典之作：</p>
<ul>
<li>理解恐懼的本質</li>
<li>注意力與專注的訓練</li>
<li>自我對話與心理模式</li>
<li>風險評估與決策</li>
<li>武術哲學在攀岩中的應用</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>攀岩心理學的開創性著作</li>
<li>獨特的心理訓練方法</li>
<li>幫助克服攀岩中的心理障礙</li>
<li>適用於各級別攀岩者</li>
</ul>
<p><strong>適合讀者</strong>：常因心理因素影響表現的攀岩者、對攀岩哲學有興趣的讀者</p>

<h3>The Climbing Bible</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Martin Mobråten、Stian Christophersen</li>
<li><strong>出版社</strong>：Vertebrate Publishing</li>
<li><strong>出版年份</strong>：2020 年</li>
<li><strong>頁數</strong>：352 頁</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>由挪威國家隊教練撰寫的現代攀岩訓練全書：</p>
<ul>
<li>技術動作的詳細分析</li>
<li>體能訓練的科學方法</li>
<li>心理準備與比賽策略</li>
<li>營養與恢復</li>
<li>受傷預防</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>資訊最新、最完整的攀岩訓練書</li>
<li>大量彩色圖片與圖表</li>
<li>由頂級教練撰寫，專業可靠</li>
<li>適合作為長期參考書</li>
</ul>
<p><strong>適合讀者</strong>：所有級別的攀岩者、想全面了解現代攀岩訓練的讀者</p>

<h2>傳記與故事類</h2>

<h3>The Push（Tommy Caldwell 自傳）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Tommy Caldwell</li>
<li><strong>出版社</strong>：Viking</li>
<li><strong>出版年份</strong>：2017 年</li>
<li><strong>頁數</strong>：400 頁</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>Tommy Caldwell 的人生故事，比任何小說都精彩：</p>
<ul>
<li>2000 年在吉爾吉斯被武裝分子綁架的經歷</li>
<li>失去一根手指後如何重返巔峰</li>
<li>完成 Dawn Wall 首攀的艱辛歷程</li>
<li>關於堅持、失敗與重新開始的人生智慧</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>紀錄片《The Dawn Wall》的完整文字版</li>
<li>堅韌精神的最佳詮釋</li>
<li>不只是攀岩書，更是勵志傳記</li>
</ul>

<h3>Alone on the Wall（Alex Honnold 自傳）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Alex Honnold、David Roberts</li>
<li><strong>出版社</strong>：W. W. Norton</li>
<li><strong>出版年份</strong>：2015 年（擴充版 2018 年）</li>
</ul>
<p><strong>內容簡介</strong></p>
<p>Alex Honnold 親自講述他的無繩獨攀生涯：</p>
<ul>
<li>成長背景與攀岩啟蒙</li>
<li>獨攀的心理準備與風險管理</li>
<li>Half Dome、Moonlight Buttress 等經典獨攀</li>
<li>2018 年擴充版包含 El Capitan 獨攀的完整記述</li>
</ul>
<p><strong>推薦理由</strong></p>
<ul>
<li>深入了解 Free Solo 主角的內心世界</li>
<li>紀錄片《Free Solo》的文字補充</li>
<li>探討風險、熱情與人生選擇</li>
</ul>

<h3>Valley Uprising（書籍版）</h3>
<p><strong>內容簡介</strong></p>
<p>優勝美地攀岩史的精彩記錄，與同名紀錄片互為補充，深入描述：</p>
<ul>
<li>1950-70 年代的先驅者故事</li>
<li>Stone Masters 時期的反文化運動</li>
<li>現代攀岩的崛起</li>
</ul>

<h2>閱讀建議</h2>

<h3>依程度選擇</h3>
<table>
<tr><th>程度</th><th>推薦書籍</th></tr>
<tr><td>初學者</td><td>一攀就上手</td></tr>
<tr><td>中階（5.10-5.11）</td><td>攀岩聖經、The Rock Warrior''s Way</td></tr>
<tr><td>進階（5.12+）</td><td>Training for Climbing、The Climbing Bible</td></tr>
</table>

<h3>依需求選擇</h3>
<table>
<tr><th>需求</th><th>推薦書籍</th></tr>
<tr><td>體能訓練</td><td>Training for Climbing、The Climbing Bible</td></tr>
<tr><td>心理訓練</td><td>The Rock Warrior''s Way</td></tr>
<tr><td>找靈感/故事</td><td>The Push、Alone on the Wall</td></tr>
</table>

<h3>建議閱讀順序</h3>
<ol>
<li>先讀一本入門書建立基礎觀念</li>
<li>選一本心理訓練書籍建立正確心態</li>
<li>根據自己的弱點選擇技術或訓練書籍</li>
<li>閱讀傳記故事保持熱情與動力</li>
</ol>

<h2>購書指南</h2>

<h3>繁體中文書籍</h3>
<ul>
<li><strong>博客來</strong>：最方便的購書平台</li>
<li><strong>誠品</strong>：可現場翻閱</li>
<li><strong>讀冊生活</strong>：二手書選擇</li>
</ul>

<h3>英文書籍</h3>
<ul>
<li><strong>Amazon</strong>：選擇最豐富</li>
<li><strong>Book Depository</strong>：免國際運費（已被 Amazon 收購）</li>
<li><strong>Kindle/Kobo</strong>：電子書選項，立即閱讀</li>
</ul>

<h2>結語</h2>
<p>閱讀是提升攀岩能力的重要途徑之一。透過前人的經驗與智慧，我們能少走彎路、更快進步。但請記住，書中的知識需要在岩壁上實踐才能真正內化。希望這份書單能幫助你找到適合的讀物，在閱讀與攀爬中持續成長！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.books.com.tw/products/0010924603" target="_blank" rel="noopener noreferrer">博客來 - 一攀就上手</a></li>
<li><a href="https://www.amazon.com/Training-Climbing-Definitive-Improving-Performance/dp/1493056778" target="_blank" rel="noopener noreferrer">Amazon - Training for Climbing</a></li>
<li><a href="https://www.amazon.com/Rock-Warriors-Way-Training-Climbers/dp/0974011215" target="_blank" rel="noopener noreferrer">Amazon - The Rock Warrior''s Way</a></li>
<li><a href="https://www.amazon.com/Climbing-Bible-Technical-Tactical-Training/dp/1839810025" target="_blank" rel="noopener noreferrer">Amazon - The Climbing Bible</a></li>
<li><a href="https://www.goodreads.com/book/show/32197428-the-push" target="_blank" rel="noopener noreferrer">Goodreads - The Push</a></li>
<li><a href="https://www.goodreads.com/book/show/25814089-alone-on-the-wall" target="_blank" rel="noopener noreferrer">Goodreads - Alone on the Wall</a></li>
<li><a href="https://www.climbing.com/culture/best-climbing-books/" target="_blank" rel="noopener noreferrer">Climbing Magazine - Best Climbing Books</a></li>
</ul>',
  NULL,
  'community',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '書籍');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '學習資源');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '攀岩文化');
