-- Seed community blog posts (expanded version)
-- Author: nobodyclimb (staff account)
-- Date: 2026-01-20
-- Category: community (社群與文化)

-- Note: nobodyclimb staff user already created in migration 0025

-- 1. 經典攀岩電影與紀錄片推薦 (約 4,000 字)
INSERT OR REPLACE INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_climbing_films',
  'nobodyclimb_staff_account_001',
  '經典攀岩電影與紀錄片推薦',
  'classic-climbing-films-documentaries',
  '從《赤手登峰》到《垂直九十度的熱血人生》，精選影響攀岩文化的經典紀錄片與電影，帶你深入了解攀岩者的內心世界與挑戰精神。',
  '<h2>前言</h2>
<p>攀岩紀錄片是認識這項運動最直接的方式之一。透過鏡頭，我們能近距離感受攀岩者面對極限時的勇氣、恐懼與堅持。相較於文字描述，影像能更真實地傳達岩壁的陡峭、動作的精準，以及選手眼中的專注與熱情。</p>
<p>本文精選近年最具影響力的攀岩電影與紀錄片，從奧斯卡得獎作品到攀岩界年度盛事，帶你進入攀岩者的世界。無論你是剛接觸攀岩的新手，還是經驗豐富的老手，這些影片都能帶給你不同層次的感動與啟發。</p>

<h2>奧斯卡級經典紀錄片</h2>

<h3>1. Free Solo《赤手登峰》（2018）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：伊莉莎白·柴·瓦沙瑞莉（Elizabeth Chai Vasarhelyi）、金國威（Jimmy Chin）</li>
<li><strong>主角</strong>：Alex Honnold</li>
<li><strong>片長</strong>：100 分鐘</li>
<li><strong>獎項</strong>：2019 年奧斯卡最佳紀錄片獎、英國影藝學院最佳紀錄片</li>
<li><strong>評分</strong>：IMDb 8.1、爛番茄 97%</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>這部紀錄片記錄了 Alex Honnold 於 2017 年 6 月 3 日無繩獨攀（Free Solo）優勝美地酋長岩（El Capitan）的歷史性壯舉。酋長岩是一塊高約 900 公尺的花崗岩巨石，Honnold 選擇攀爬的 Freerider 路線難度達 5.13a，他在沒有任何繩索或保護裝置的情況下，僅花費 3 小時 56 分鐘完成攀登。</p>
<p>影片不僅記錄了這次攀登本身，更深入探討 Honnold 的成長背景、心理狀態、與女友 Sanni McCandless 的關係，以及他如何花費數年時間準備這次挑戰。導演 Jimmy Chin 本身就是世界級的攀岩者與高山攝影師，他帶領的攝影團隊同樣需要在岩壁上作業，拍攝難度極高。</p>

<p><strong>精彩看點</strong></p>
<ul>
<li><strong>Boulder Problem 段落</strong>：Freerider 路線上最難的一段，需要在近乎光滑的岩壁上做出極為精準的動作</li>
<li><strong>腦部掃描研究</strong>：影片呈現科學家對 Honnold 大腦的研究，發現他的杏仁核（掌管恐懼反應的區域）活動異常低</li>
<li><strong>攝影團隊的掙扎</strong>：團隊成員坦言，他們不確定自己是否能承受親眼目睹朋友墜落的可能性</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>奧斯卡金像獎肯定，製作水準極高</li>
<li>深入探討極限運動員的心理狀態</li>
<li>攝影角度令人屏息，許多鏡頭會讓你手心冒汗</li>
<li>不僅是攀岩紀錄片，更是探討人類極限的哲學作品</li>
<li>即使完全不懂攀岩的觀眾也能被深深吸引</li>
</ul>

<p><strong>觀看平台</strong></p>
<ul>
<li>Disney+（台灣可看）</li>
<li>National Geographic 頻道</li>
<li>iTunes / Google Play 租借</li>
</ul>

<h3>2. The Dawn Wall《垂直九十度的熱血人生》（2017）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Josh Lowell、Peter Mortimer（Sender Films）</li>
<li><strong>主角</strong>：Tommy Caldwell、Kevin Jorgeson</li>
<li><strong>片長</strong>：100 分鐘</li>
<li><strong>評分</strong>：IMDb 8.1、爛番茄 96%</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>2015 年 1 月，Tommy Caldwell 與 Kevin Jorgeson 花費 19 天，首次以「自由攀登」（Free Climb）方式完成酋長岩東南面的 Dawn Wall 路線。這條路線被認為是世界上最難的大岩壁路線，全長 32 個繩距（約 900 公尺），最難的段落達到 5.14d。</p>
<p>影片交織著攀登過程與 Tommy Caldwell 的人生故事。2000 年，年僅 22 歲的 Caldwell 在吉爾吉斯坦攀登時被武裝叛軍綁架，他與隊友在六天的驚恐中求生，最終 Caldwell 將一名看守推下懸崖才得以逃脫。同年，他在一次木工意外中失去了左手食指——對攀岩者來說幾乎是職業生涯的終結。然而，他不僅重返岩壁，更達到了前所未有的高度。</p>

<p><strong>精彩看點</strong></p>
<ul>
<li><strong>Pitch 15</strong>：全路線最難的繩距，Kevin Jorgeson 連續嘗試 11 天才完成，期間 Tommy 在上方等待，展現真正的夥伴精神</li>
<li><strong>指皮恢復</strong>：攀登者的指尖會被岩石磨損，影片呈現他們如何在帳篷中休息、等待指皮恢復</li>
<li><strong>全球媒體關注</strong>：這次攀登吸引了全球媒體報導，連美國總統歐巴馬都發推特祝賀</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>Tommy Caldwell 的人生故事本身就是最動人的劇本</li>
<li>展現團隊合作與永不放棄的精神</li>
<li>攀登過程的戲劇性令人揪心</li>
<li>完美詮釋「不可能」如何被人類的意志克服</li>
<li>適合與《Free Solo》對照觀看，了解不同類型的攀登挑戰</li>
</ul>

<p><strong>觀看平台</strong></p>
<ul>
<li>Netflix（部分地區）</li>
<li>Amazon Prime Video</li>
<li>iTunes / Google Play 租借</li>
</ul>

<h3>3. The Alpinist《登山者》（2021）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Peter Mortimer、Nick Rosen</li>
<li><strong>主角</strong>：Marc-André Leclerc</li>
<li><strong>片長</strong>：93 分鐘</li>
<li><strong>評分</strong>：IMDb 8.0、爛番茄 97%</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>Marc-André Leclerc 是加拿大的登山天才，專精於冬季高山獨攀（Solo Alpine Climbing）。與 Alex Honnold 不同的是，Leclerc 刻意避開媒體關注，不使用社群媒體，他的許多攀登甚至沒有任何影像記錄。他在荒野中進行最純粹的攀登，認為攀登的價值不在於被看見，而在於與山的對話。</p>
<p>影片追蹤 Leclerc 的生涯，包括他在巴塔哥尼亞、加拿大洛磯山脈、阿拉斯加等地的驚人攀登。2018 年 3 月，年僅 25 歲的 Leclerc 與女友 Michelle Kadatz 在阿拉斯加的 Mendenhall Towers 攀登時遭遇雪崩，雙雙罹難。</p>

<p><strong>精彩看點</strong></p>
<ul>
<li><strong>Torre Egger 冬季獨攀</strong>：Leclerc 在巴塔哥尼亞惡劣的天候中獨自攀登這座技術性極高的山峰</li>
<li><strong>與 Honnold 的對比</strong>：影片中 Alex Honnold 親自評論 Leclerc 的攀登，稱其為「真正的勇者」</li>
<li><strong>最後的攀登</strong>：影片拍攝團隊直到最後都無法追蹤到 Leclerc 的行蹤，這也成為他神秘形象的一部分</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>呈現最純粹、最極致的登山精神</li>
<li>Leclerc 的謙遜與對攀登的熱愛令人動容</li>
<li>壯麗的高山攝影，冰雪世界的美與險</li>
<li>引發對風險、熱情與人生意義的深刻思考</li>
<li>結局令人心碎，但也讓人重新思考何為「活著」</li>
</ul>

<p><strong>觀看平台</strong></p>
<ul>
<li>Netflix</li>
<li>Amazon Prime Video</li>
<li>iTunes / Google Play 租借</li>
</ul>

<h2>攀岩歷史經典</h2>

<h3>4. Valley Uprising《山谷崛起》（2014）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Peter Mortimer、Nick Rosen（Sender Films）</li>
<li><strong>片長</strong>：101 分鐘</li>
<li><strong>類型</strong>：歷史紀錄片</li>
<li><strong>評分</strong>：IMDb 8.2</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>《Valley Uprising》講述優勝美地國家公園 50 年來的攀岩歷史，從 1950 年代的先驅者到現代的極限攀登。影片將這段歷史分為三個時代：</p>

<p><strong>第一時代：先驅者（1950s-1960s）</strong></p>
<ul>
<li>Royal Robbins 與 Warren Harding 的風格之爭</li>
<li>Harding 以「圍城」方式首攀 The Nose（1958，歷時 47 天）</li>
<li>Robbins 倡導更純粹的「公平手段」攀登</li>
</ul>

<p><strong>第二時代：Stonemasters（1970s）</strong></p>
<ul>
<li>嬉皮文化與攀岩的結合</li>
<li>John Bachar、Ron Kauk、Lynn Hill 等傳奇人物</li>
<li>攀岩者住在營地、與國家公園管理員周旋的叛逆歲月</li>
</ul>

<p><strong>第三時代：現代先鋒（1990s-2010s）</strong></p>
<ul>
<li>Lynn Hill 首次自由攀登 The Nose（1993）</li>
<li>Tommy Caldwell、Alex Honnold 的崛起</li>
<li>攀岩從邊緣運動走向主流</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>了解攀岩文化演進的必看之作</li>
<li>珍貴的歷史影像資料，許多是首次公開</li>
<li>生動呈現不同世代攀岩者的風格與衝突</li>
<li>配樂與剪輯節奏極佳，娛樂性與知識性兼具</li>
<li>觀看後再看其他攀岩紀錄片會有更深的理解</li>
</ul>

<p><strong>觀看平台</strong></p>
<ul>
<li>Amazon Prime Video</li>
<li>Red Bull TV（免費）</li>
<li>Vimeo 租借</li>
</ul>

<h3>5. Meru《攀登梅魯峰》（2015）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Jimmy Chin、Elizabeth Chai Vasarhelyi</li>
<li><strong>主角</strong>：Conrad Anker、Jimmy Chin、Renan Ozturk</li>
<li><strong>片長</strong>：87 分鐘</li>
<li><strong>評分</strong>：IMDb 7.7</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>Meru Peak 位於印度喜馬拉雅山脈，其中央峰的「鯊魚鰭」（Shark''s Fin）路線被認為是登山界最難的技術路線之一，曾有超過 20 次嘗試全部失敗。2008 年，Conrad Anker、Jimmy Chin、Renan Ozturk 三人組首次挑戰，在距離峰頂不到 100 公尺處因暴風雪被迫撤退。</p>
<p>2011 年，儘管 Ozturk 在此前的滑雪意外中嚴重腦傷，三人仍決定再次挑戰。這部紀錄片記錄了兩次攀登的完整過程，以及三位攀登者各自面對的人生困境。</p>

<p><strong>推薦理由</strong></p>
<ul>
<li>《Free Solo》導演組合的前作，製作水準同樣精良</li>
<li>展現高海拔技術攀登的真實樣貌</li>
<li>三位攀登者的個人故事都極具深度</li>
<li>失敗後重新站起的勇氣令人動容</li>
</ul>

<h2>年度攀岩盛事</h2>

<h3>6. Reel Rock 系列</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>製作</strong>：Sender Films、Big UP Productions</li>
<li><strong>形式</strong>：年度攀岩電影合輯，每年發行</li>
<li><strong>歷史</strong>：自 2006 年開始，已發行超過 18 集</li>
<li><strong>片長</strong>：每集約 90-120 分鐘（含 3-5 部短片）</li>
</ul>

<p><strong>內容介紹</strong></p>
<p>Reel Rock 是攀岩界最重要的年度影展，每年精選 3-5 部短片，涵蓋競技攀岩、傳統攀登、抱石、大岩壁等各種主題。許多後來發展成長片的經典紀錄片，最初都是從 Reel Rock 短片開始的。</p>

<p><strong>歷年精選作品</strong></p>
<ul>
<li><strong>Reel Rock 11（2016）</strong>：收錄 Alex Honnold 準備獨攀的早期影像</li>
<li><strong>Reel Rock 12（2017）</strong>：《Age of Ondra》，記錄 Adam Ondra 挑戰 Silence（9c）</li>
<li><strong>Reel Rock 13（2018）</strong>：《Queen Margo》，記錄 Margo Hayes 成為首位完攀 9a+ 的女性</li>
<li><strong>Reel Rock 14（2019）</strong>：《The High Road》，Janja Garnbret 的統治之路</li>
<li><strong>Reel Rock 17（2022）</strong>：《Cenote》，深水獨攀的極限挑戰</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>了解每年攀岩界最重要事件的最佳管道</li>
<li>短片形式，每部約 20-30 分鐘，適合零碎時間觀看</li>
<li>涵蓋各種攀岩類型，總有適合你的口味</li>
<li>每年全球巡迴放映，可參加現場活動感受攀岩社群氛圍</li>
</ul>

<p><strong>觀看平台</strong></p>
<ul>
<li>Reel Rock 官網（reelrocktour.com）付費串流</li>
<li>Vimeo / iTunes 租借</li>
<li>部分舊作品在 YouTube 免費觀看</li>
</ul>

<h2>競技攀岩紀錄片</h2>

<h3>7. Age of Ondra《翁德拉的時代》（2017）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Petr Pavlíček</li>
<li><strong>主角</strong>：Adam Ondra</li>
<li><strong>片長</strong>：75 分鐘</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>記錄捷克攀岩天才 Adam Ondra 挑戰世界首條 9c 難度路線「Silence」的過程。Ondra 從 2012 年開始嘗試這條位於挪威 Flatanger 洞穴中的路線，歷經五年、超過 60 天的嘗試，終於在 2017 年完成。影片同時回顧了 Ondra 的成長歷程，從 6 歲開始攀岩，到成為公認「史上最強攀岩者」的道路。</p>

<p><strong>精彩看點</strong></p>
<ul>
<li><strong>Ondra 的標誌性尖叫</strong>：他在困難動作時發出的喊叫聲是攀岩界的獨特標誌</li>
<li><strong>9c 的意義</strong>：這是人類首次突破 9c 難度，代表攀岩能力的新極限</li>
<li><strong>童年影像</strong>：影片收錄 Ondra 幼年攀岩的珍貴畫面</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>深入了解被譽為「史上最強」的攀岩者</li>
<li>見證攀岩難度極限的突破時刻</li>
<li>Ondra 獨特的攀爬風格與訓練哲學</li>
<li>對於想提升攀岩實力的人極具啟發性</li>
</ul>

<h3>8. 奧運相關紀錄片</h3>
<p>隨著攀岩成為奧運項目，相關紀錄片也越來越多：</p>
<ul>
<li><strong>《Road to Tokyo》系列</strong>：IFSC 官方製作，記錄選手備戰 2020 東京奧運</li>
<li><strong>《Janja》</strong>：斯洛維尼亞電視台製作的 Janja Garnbret 紀錄片</li>
<li><strong>各國奧運選拔紀錄</strong>：YouTube 上有許多各國選手的備戰紀錄</li>
</ul>

<h2>經典老片</h2>

<h3>9. Touching the Void《攀越冰峰》（2003）</h3>
<p><strong>基本資訊</strong></p>
<ul>
<li><strong>導演</strong>：Kevin Macdonald</li>
<li><strong>原著</strong>：Joe Simpson 同名著作</li>
<li><strong>片長</strong>：106 分鐘</li>
<li><strong>形式</strong>：劇情重現 + 當事人訪談</li>
</ul>

<p><strong>劇情概要</strong></p>
<p>1985 年，英國登山者 Joe Simpson 與 Simon Yates 攀登秘魯安地斯山脈的 Siula Grande 峰（6,344 公尺）西壁。下撤時 Simpson 摔斷腿，在 Yates 用繩索垂降他的過程中，Simpson 滑落到一個冰崖邊緣，懸在半空中無法動彈。在暴風雪中等待數小時後，Yates 做出了一個痛苦的決定——切斷繩索。</p>
<p>Simpson 墜入冰隙，但奇蹟般地存活。接下來的三天，他拖著斷腿，在沒有食物和水的情況下爬行數公里回到營地。這個真實故事被譽為登山史上最偉大的求生奇蹟。</p>

<p><strong>推薦理由</strong></p>
<ul>
<li>登山紀錄片經典中的經典</li>
<li>探討極端環境下的道德抉擇：切斷繩索是正確的嗎？</li>
<li>人類求生意志的極致展現</li>
<li>真實當事人的訪談增添可信度與情感深度</li>
</ul>

<h3>10. King Lines（2007）</h3>
<p><strong>主角</strong>：Chris Sharma</p>
<p>記錄 Chris Sharma 在 2000 年代中期挑戰世界最難路線的歷程，包括他在西班牙完攀 Realization（5.15a，當時世界最難）等歷史性攀登。影片展現了 Sharma 獨特的「流動式」攀爬風格，以及他將攀岩難度天花板不斷推高的過程。</p>

<h2>觀影指南</h2>

<h3>依程度選擇</h3>
<table>
<thead><tr><th>觀眾類型</th><th>推薦影片</th><th>原因</th></tr></thead>
<tbody>
<tr><td>完全不懂攀岩</td><td>Free Solo、The Dawn Wall</td><td>故事性強，不需攀岩知識也能理解</td></tr>
<tr><td>剛開始攀岩</td><td>Valley Uprising、Reel Rock</td><td>了解攀岩文化與歷史背景</td></tr>
<tr><td>有經驗的攀岩者</td><td>Age of Ondra、The Alpinist</td><td>更專業的內容，技術細節更多</td></tr>
<tr><td>資深攀岩愛好者</td><td>Meru、King Lines</td><td>高山與高難度路線的深度記錄</td></tr>
</tbody>
</table>

<h3>依興趣選擇</h3>
<table>
<thead><tr><th>興趣</th><th>推薦影片</th></tr></thead>
<tbody>
<tr><td>喜歡驚險刺激</td><td>Free Solo、The Alpinist</td></tr>
<tr><td>喜歡人物故事</td><td>The Dawn Wall、Meru</td></tr>
<tr><td>對攀岩歷史有興趣</td><td>Valley Uprising</td></tr>
<tr><td>對競技攀岩有興趣</td><td>Age of Ondra、Reel Rock</td></tr>
<tr><td>想要學習技術</td><td>Reel Rock 系列、各選手 YouTube 頻道</td></tr>
</tbody>
</table>

<h3>觀看順序建議</h3>
<p>如果你是攀岩紀錄片新手，建議依照以下順序觀看：</p>
<ol>
<li><strong>Valley Uprising</strong> — 先了解攀岩歷史脈絡</li>
<li><strong>Free Solo</strong> — 最知名的攀岩紀錄片，建立基本認識</li>
<li><strong>The Dawn Wall</strong> — 另一種類型的挑戰，團隊合作與堅持</li>
<li><strong>The Alpinist</strong> — 探索更純粹的登山精神</li>
<li><strong>Reel Rock 系列</strong> — 持續追蹤攀岩界最新動態</li>
</ol>

<h2>延伸推薦</h2>

<h3>攀岩相關劇情片</h3>
<ul>
<li><strong>《巔峰戰士》Cliffhanger（1993）</strong>：席維斯·史特龍主演的經典動作片</li>
<li><strong>《巔峰極限》Vertical Limit（2000）</strong>：K2 山難救援的動作片</li>
<li><strong>The Wall（2017）</strong>：德國片，講述攀岩者在岩壁上的心理掙扎</li>
</ul>

<h3>YouTube 頻道推薦</h3>
<ul>
<li><strong>IFSC 官方頻道</strong>：所有世界盃比賽的完整直播與回放</li>
<li><strong>EpicTV Climbing</strong>：攀岩新聞與短片</li>
<li><strong>Magnus Midtbø</strong>：挪威前職業選手的攀岩娛樂頻道</li>
<li><strong>Adam Ondra</strong>：個人頻道，記錄訓練與攀登</li>
</ul>

<h2>結語</h2>
<p>攀岩紀錄片不只是記錄攀登過程，更是探討人類如何面對恐懼、挑戰極限、追求夢想的故事。透過這些影片，我們能看到攀岩者在岩壁上的專注與勇氣，也能感受到他們在日常生活中的掙扎與堅持。</p>
<p>無論你是否攀岩，這些影片都能帶來深刻的啟發與感動。找一個週末，選一部開始看吧！當你下次站在岩壁前，或許會有不一樣的感受。</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.imdb.com/title/tt7775622/" target="_blank" rel="noopener noreferrer">IMDb - Free Solo</a>（評分、基本資料）</li>
<li><a href="https://www.imdb.com/title/tt7286916/" target="_blank" rel="noopener noreferrer">IMDb - The Dawn Wall</a>（評分、基本資料）</li>
<li><a href="https://www.imdb.com/title/tt11790780/" target="_blank" rel="noopener noreferrer">IMDb - The Alpinist</a>（評分、基本資料）</li>
<li><a href="https://www.imdb.com/title/tt3784160/" target="_blank" rel="noopener noreferrer">IMDb - Valley Uprising</a>（評分、基本資料）</li>
<li><a href="https://www.imdb.com/title/tt2967798/" target="_blank" rel="noopener noreferrer">IMDb - Meru</a>（評分、基本資料）</li>
<li><a href="https://www.reelrocktour.com/" target="_blank" rel="noopener noreferrer">Reel Rock Tour 官網</a>（歷年作品資訊）</li>
<li><a href="https://en.wikipedia.org/wiki/Free_Solo" target="_blank" rel="noopener noreferrer">Wikipedia - Free Solo</a>（詳細背景資料）</li>
<li><a href="https://en.wikipedia.org/wiki/The_Dawn_Wall_(film)" target="_blank" rel="noopener noreferrer">Wikipedia - The Dawn Wall</a>（詳細背景資料）</li>
<li><a href="https://en.wikipedia.org/wiki/Marc-Andr%C3%A9_Leclerc" target="_blank" rel="noopener noreferrer">Wikipedia - Marc-André Leclerc</a>（選手生平）</li>
<li><a href="https://www.climbing.com/culture/best-climbing-movies-all-time/" target="_blank" rel="noopener noreferrer">Climbing Magazine - Best Climbing Movies</a>（影片評選參考）</li>
</ul>',
  NULL,
  'community',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

-- 刪除舊 tags 後重新插入
DELETE FROM post_tags WHERE post_id = 'post_community_climbing_films';
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', '紀錄片');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', '電影');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', '攀岩文化');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_films', 'Free Solo');

-- 2. 當代最強攀岩選手介紹 (約 5,000 字)
INSERT OR REPLACE INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_top_climbers',
  'nobodyclimb_staff_account_001',
  '當代最強攀岩選手介紹',
  'top-climbers-of-modern-era',
  '從 Adam Ondra 到 Janja Garnbret，認識當今攀岩界最頂尖的選手，了解他們的成就、風格與對這項運動的貢獻。',
  '<h2>前言</h2>
<p>攀岩運動在過去十年經歷了前所未有的發展。隨著 2020 東京奧運將攀岩納入正式項目，這項運動獲得了前所未有的關注度。而推動這項運動不斷向前的，正是那些在岩壁上挑戰人類極限的頂尖選手們。</p>
<p>本文將介紹當代最具影響力的攀岩選手，從戶外攀岩的傳奇人物到競技場上的常勝軍，從歐美強權到亞洲新星。我們將深入了解他們的成就、風格，以及他們如何書寫攀岩歷史。</p>

<h2>競技攀岩傳奇</h2>

<h3>Adam Ondra（捷克）— 史上最強攀岩者</h3>

<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1993 年 2 月 5 日（32 歲）</li>
<li><strong>國籍</strong>：捷克</li>
<li><strong>身高</strong>：185 公分</li>
<li><strong>體重</strong>：約 66 公斤</li>
<li><strong>專長</strong>：先鋒攀登、抱石、傳統攀登</li>
<li><strong>Instagram</strong>：<a href="https://www.instagram.com/adam.ondra/" target="_blank">@adam.ondra</a>（240 萬追蹤）</li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li><strong>世界首攀 9c</strong>：2017 年完攀 Silence（挪威），這是目前公認世界上最難的路線</li>
<li><strong>世界錦標賽</strong>：4 屆金牌（先鋒 2014、2019；抱石 2014、2018）</li>
<li><strong>唯一雙冠王</strong>：2014 年成為史上唯一在同一年贏得先鋒與抱石世錦賽雙冠軍的男選手</li>
<li><strong>超過 180 條 9a+</strong>：完攀超過 180 條 9a 及以上難度路線</li>
<li><strong>最年輕紀錄</strong>：13 歲完攀 8c+，15 歲完攀 9a</li>
<li><strong>2020 東京奧運</strong>：第六名</li>
</ul>

<p><strong>代表路線</strong></p>
<table>
<thead><tr><th>路線名稱</th><th>難度</th><th>地點</th><th>完攀年份</th><th>意義</th></tr></thead>
<tbody>
<tr><td>Silence</td><td>9c</td><td>挪威 Flatanger</td><td>2017</td><td>世界首條 9c</td></tr>
<tr><td>Change</td><td>9b+</td><td>挪威 Flatanger</td><td>2012</td><td>世界首條 9b+</td></tr>
<tr><td>Vasil Vasil</td><td>9b+</td><td>捷克</td><td>2013</td><td>家鄉的極限路線</td></tr>
<tr><td>Dawn Wall</td><td>5.14d</td><td>美國優勝美地</td><td>2016</td><td>史上第三人完攀</td></tr>
</tbody>
</table>

<p><strong>攀爬風格與特色</strong></p>
<p>Ondra 最為人知的特色是他在困難動作時發出的標誌性尖叫聲，這種獨特的「戰吼」已成為攀岩界的經典畫面。他的攀爬風格極具分析性，會花費大量時間研究路線的每一個細節，找出最佳的動作序列。</p>
<p>技術層面，Ondra 是真正的全能型選手：</p>
<ul>
<li>指力驚人，能在極小的岩點上維持</li>
<li>耐力出眾，擅長長距離的持續攀爬</li>
<li>動態能力強，能完成高難度的跳躍動作</li>
<li>路線閱讀能力一流，經常能找出其他人沒想到的解法</li>
</ul>

<p><strong>為何被稱為「史上最強」</strong></p>
<p>Adam Ondra 被普遍認為是攀岩史上最偉大的選手，原因包括：</p>
<ol>
<li><strong>難度天花板的推進者</strong>：他不只是完成最難的路線，更是創造最難路線的人</li>
<li><strong>全面性</strong>：無論是抱石、先鋒、傳統攀登還是大岩壁，他都達到世界頂尖水準</li>
<li><strong>競技與戶外雙棲</strong>：在競賽場上也是常勝軍，證明他的實力經得起各種檢驗</li>
<li><strong>持續進步</strong>：從 13 歲開始就不斷突破紀錄，至今仍在攀岩的最前線</li>
</ol>

<h3>Janja Garnbret（斯洛維尼亞）— 女子攀岩 GOAT</h3>

<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1999 年 3 月 12 日（26 歲）</li>
<li><strong>國籍</strong>：斯洛維尼亞</li>
<li><strong>身高</strong>：164 公分</li>
<li><strong>專長</strong>：先鋒攀登、抱石</li>
<li><strong>Instagram</strong>：<a href="https://www.instagram.com/jabornet/" target="_blank">@jabornet</a>（85 萬追蹤）</li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li><strong>2 屆奧運金牌</strong>：2020 東京、2024 巴黎（女子複合賽）</li>
<li><strong>8 屆世界錦標賽冠軍</strong>：史上最多</li>
<li><strong>6 屆世界盃總冠軍</strong>：先鋒與抱石皆有</li>
<li><strong>完美賽季</strong>：2019 年抱石世界盃全勝（6 站全贏）</li>
<li><strong>斯洛維尼亞最高體育榮譽</strong>：Bloudek 獎得主</li>
<li><strong>戶外難度</strong>：完攀多條 8c+ 及 9a 路線</li>
</ul>

<p><strong>成長背景</strong></p>
<p>Garnbret 7 歲開始攀岩，13 歲就贏得歐洲青少年錦標賽冠軍。她來自斯洛維尼亞這個人口僅 200 萬的小國，但這個國家卻有著深厚的攀岩傳統（斯洛維尼亞高山協會 PZS 成立於 1893 年）。在頂尖教練的培養下，她迅速成為世界級選手。</p>

<p><strong>統治力的體現</strong></p>
<p>Garnbret 在競技攀岩的統治力是前所未見的：</p>
<ul>
<li>2019 年抱石世界盃，她贏得全部 6 站比賽，這在任何運動中都是極為罕見的</li>
<li>在 2020 東京奧運，她在抱石項目中完攀了全部 3 條決賽路線，是唯一做到的選手</li>
<li>2024 巴黎奧運成功衛冕，證明她的統治地位穩固</li>
</ul>

<p><strong>攀爬風格</strong></p>
<ul>
<li><strong>動作效率極高</strong>：她的攀爬看起來輕鬆流暢，絕少有多餘動作</li>
<li><strong>心理素質頂尖</strong>：在壓力下幾乎從不失誤</li>
<li><strong>路線閱讀快速準確</strong>：常常能在短時間內找出最佳解法</li>
<li><strong>力量與技巧完美結合</strong>：不靠蠻力，而是精準的技術</li>
</ul>

<h3>Jakob Schubert（奧地利）— 比賽穩定之王</h3>

<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1990 年 12 月 31 日（35 歲）</li>
<li><strong>國籍</strong>：奧地利</li>
<li><strong>專長</strong>：先鋒攀登</li>
<li><strong>Instagram</strong>：<a href="https://www.instagram.com/jakob.schubert/" target="_blank">@jakob.schubert</a></li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li><strong>3 屆世界錦標賽先鋒冠軍</strong>（2018、2021、2023）</li>
<li><strong>2020 東京奧運銅牌</strong></li>
<li><strong>多屆世界盃總冠軍</strong></li>
<li><strong>戶外難度</strong>：完攀多條 9b+ 路線，包括 Perfecto Mundo</li>
</ul>

<p><strong>特色</strong></p>
<p>Schubert 是競技攀岩中最穩定的選手之一。他在重大比賽中的發揮總是令人信賴，心理素質極強。在戶外攀岩方面，他也達到世界頂尖水準，是少數能在競技與戶外都維持高水準的選手。</p>

<h2>戶外攀岩傳奇</h2>

<h3>Alex Honnold（美國）— 無繩獨攀之神</h3>

<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1985 年 8 月 17 日（40 歲）</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>身高</strong>：180 公分</li>
<li><strong>專長</strong>：無保護獨攀（Free Solo）、大岩壁攀登</li>
<li><strong>Instagram</strong>：<a href="https://www.instagram.com/alexhonnold/" target="_blank">@alexhonnold</a>（310 萬追蹤）</li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li><strong>無繩獨攀酋長岩</strong>：2017 年 6 月 3 日，3 小時 56 分完成 Freerider 路線（5.13a，約 900 公尺）</li>
<li><strong>奧斯卡最佳紀錄片</strong>：《Free Solo》主角</li>
<li><strong>多項大岩壁速度紀錄</strong>：與 Tommy Caldwell 搭檔的 The Nose 速攀紀錄</li>
<li><strong>國家地理探險家</strong></li>
<li><strong>Honnold Foundation</strong>：創立公益基金會，推動太陽能發展</li>
</ul>

<p><strong>為何他的成就如此偉大</strong></p>
<p>無繩獨攀酋長岩被許多人認為是人類攀岩史上最偉大的單一成就：</p>
<ul>
<li>酋長岩高約 900 公尺，是世界最大的花崗岩巨石之一</li>
<li>Freerider 路線有超過 30 個繩距，最難處達 5.13a</li>
<li>沒有任何繩索或保護，一個失誤就是死亡</li>
<li>這次攀登花費數年準備，Honnold 將整條路線的每個動作都記在腦中</li>
</ul>

<p><strong>心理特質</strong></p>
<p>科學研究發現，Honnold 的大腦杏仁核（掌管恐懼反應的區域）活動異常低。但他本人強調，這不代表他「不怕」，而是他透過大量準備將風險降到最低，讓恐懼變得可控。</p>

<h3>Tommy Caldwell（美國）— 堅韌精神的代名詞</h3>

<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1978 年 8 月 11 日（47 歲）</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>專長</strong>：大岩壁自由攀登、傳統攀登</li>
<li><strong>Instagram</strong>：<a href="https://www.instagram.com/tommycaldwell/" target="_blank">@tommycaldwell</a></li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li><strong>首次自由攀登 Dawn Wall</strong>：2015 年與 Kevin Jorgeson 搭檔，歷時 19 天</li>
<li><strong>多條優勝美地經典路線首攀</strong></li>
<li><strong>The Nose 速攀紀錄</strong>：曾與 Alex Honnold 搭檔保持紀錄</li>
<li><strong>自傳《The Push》</strong>：暢銷書</li>
</ul>

<p><strong>傳奇人生故事</strong></p>
<p>Tommy Caldwell 的人生本身就是一部傳奇：</p>
<ol>
<li><strong>2000 年吉爾吉斯綁架事件</strong>：在吉爾吉斯坦攀登時被武裝叛軍綁架六天，最終他將一名看守推下懸崖才得以逃脫</li>
<li><strong>失去手指</strong>：同年在木工意外中失去左手食指，這對攀岩者來說幾乎是職業生涯的終結</li>
<li><strong>重返巔峰</strong>：他不僅重返岩壁，更達到了前所未有的高度</li>
<li><strong>Dawn Wall</strong>：花費 7 年時間準備，最終完成被認為不可能的挑戰</li>
</ol>

<h3>Chris Sharma（美國）— 難度天花板的推進者</h3>

<p><strong>基本資料</strong></p>
<ul>
<li><strong>出生</strong>：1981 年 4 月 23 日（44 歲）</li>
<li><strong>國籍</strong>：美國</li>
<li><strong>居住地</strong>：西班牙</li>
<li><strong>專長</strong>：運動攀登、深水獨攀（DWS）</li>
<li><strong>Instagram</strong>：<a href="https://www.instagram.com/chris_sharma/" target="_blank">@chris_sharma</a></li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li><strong>世界首條 9b</strong>：2001 年完攀 Realization / Biographie（法國 Céüse）</li>
<li><strong>多條 9b+ 路線首攀</strong>：La Dura Dura、Jumbo Love 等</li>
<li><strong>深水獨攀先驅</strong>：Es Pontàs 等經典 DWS 路線</li>
<li><strong>經營 Sender One 攀岩館</strong>：在美國洛杉磯與聖安娜</li>
</ul>

<p><strong>攀爬風格</strong></p>
<p>Sharma 被稱為「攀岩界的衝浪者」，他的攀爬風格直覺、流動，看起來像在岩壁上跳舞。他推動了 2000-2010 年代攀岩難度的天花板，為後來的 Adam Ondra 等選手鋪平道路。</p>

<h2>新生代頂尖選手</h2>

<h3>Tomoa Narasaki 楢﨑智亞（日本）</h3>
<p><strong>成就</strong>：2 屆世界錦標賽抱石冠軍（2016、2019）、2020 東京奧運銅牌</p>
<p><strong>特色</strong>：驚人的動態能力，協調跳躍（Coordination）動作堪稱一絕。作為日本攀岩的代表人物，他推動了競技攀岩在亞洲的發展。</p>

<h3>Ai Mori 森秋彩（日本）</h3>
<p><strong>成就</strong>：2024 巴黎奧運複合賽銀牌、多屆世界盃獎牌</p>
<p><strong>特色</strong>：身材嬌小但技術細膩，是少數能與 Janja Garnbret 競爭的選手。她的路線閱讀能力與心理素質都非常出色。</p>

<h3>Toby Roberts（英國）</h3>
<p><strong>成就</strong>：2024 巴黎奧運男子複合賽金牌</p>
<p><strong>特色</strong>：英國攀岩的新星，在巴黎奧運上一鳴驚人。他的技術全面，在先鋒與抱石都有穩定發揮。</p>

<h3>Brooke Raboutou（美國）</h3>
<p><strong>成就</strong>：2024 巴黎奧運複合賽銅牌、多屆青少年世界冠軍</p>
<p><strong>特色</strong>：出身攀岩世家（父母都是職業攀岩者），從小展現驚人天賦。她的抱石技術特別出色，動作細膩優雅。</p>

<h3>Sam Watson（美國）</h3>
<p><strong>成就</strong>：男子速度攀岩世界紀錄保持人（4.64 秒，2025 年）</p>
<p><strong>特色</strong>：年僅 20 歲就打破世界紀錄，代表美國速度攀岩的崛起。他是首位突破 4.7 秒大關的選手。</p>

<h3>Aleksandra Miroslaw（波蘭）</h3>
<p><strong>成就</strong>：女子速度攀岩世界紀錄保持人（6.06 秒）、2024 巴黎奧運女子速度金牌</p>
<p><strong>特色</strong>：女子速度攀岩的絕對統治者，連續多年打破自己的世界紀錄。她在巴黎奧運決賽中以破紀錄成績奪冠。</p>

<h3>Veddriq Leonardo（印尼）</h3>
<p><strong>成就</strong>：2024 巴黎奧運男子速度金牌、前世界紀錄保持人</p>
<p><strong>特色</strong>：印尼速度攀岩傳統的繼承者，爆發力驚人。他的奧運金牌是印尼攀岩的歷史性突破。</p>

<h2>台灣選手</h2>

<h3>李虹瑩 — 台灣攀岩一姐</h3>
<p><strong>基本資料</strong></p>
<ul>
<li><strong>專長</strong>：先鋒攀登、抱石</li>
<li><strong>身份</strong>：選手、教練、作家</li>
</ul>

<p><strong>主要成就</strong></p>
<ul>
<li>多次代表台灣參加亞洲錦標賽與世界盃</li>
<li>台灣攀岩推廣的重要人物</li>
<li>著有《一攀就上手：基礎攀岩一次就學會》</li>
</ul>

<p><strong>貢獻</strong></p>
<p>李虹瑩不僅是優秀的選手，更是台灣攀岩推廣的重要推手。她的著作幫助許多新手入門，她的教學影響了一代台灣攀岩者。</p>

<h2>如何追蹤選手動態</h2>

<h3>社群媒體帳號整理</h3>
<table>
<thead><tr><th>選手</th><th>Instagram</th><th>YouTube</th></tr></thead>
<tbody>
<tr><td>Adam Ondra</td><td>@adam.ondra</td><td>Adam Ondra</td></tr>
<tr><td>Janja Garnbret</td><td>@janjagarnbret</td><td>-</td></tr>
<tr><td>Alex Honnold</td><td>@alexhonnold</td><td>-</td></tr>
<tr><td>Tommy Caldwell</td><td>@tommycaldwell</td><td>-</td></tr>
<tr><td>Magnus Midtbø</td><td>@magnusmidtbo</td><td>Magnus Midtbø</td></tr>
</tbody>
</table>

<h3>賽事直播平台</h3>
<ul>
<li><strong>IFSC YouTube 頻道</strong>：所有世界盃與世錦賽的免費直播</li>
<li><strong>Olympics.com</strong>：奧運相關內容</li>
<li><strong>Red Bull TV</strong>：部分攀岩賽事與紀錄片</li>
</ul>

<h3>推薦 YouTube 頻道</h3>
<ul>
<li><strong>IFSC</strong>：官方賽事頻道</li>
<li><strong>Magnus Midtbø</strong>：挪威前職業選手，娛樂性與專業性兼具</li>
<li><strong>Adam Ondra</strong>：個人頻道，記錄訓練與攀登</li>
<li><strong>EpicTV Climbing</strong>：攀岩新聞與短片</li>
</ul>

<h2>結語</h2>
<p>這些頂尖選手不僅在攀岩成績上創造歷史，更透過他們的故事激勵無數人挑戰自我、追求夢想。從 Adam Ondra 的技術極限，到 Janja Garnbret 的統治力，從 Alex Honnold 的冷靜與勇氣，到 Tommy Caldwell 的堅韌不拔——每一位選手都以自己的方式詮釋著攀岩的精神。</p>
<p>隨著攀岩運動持續發展，我們期待看到更多亞洲選手崛起，也期待台灣選手能在國際舞台上發光發熱。下次當你站在岩壁前，或許可以想想這些選手的故事，讓他們的精神成為你攀爬的動力。</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.ifsc-climbing.org/athletes" target="_blank" rel="noopener noreferrer">IFSC 選手資料庫</a>（官方成績與排名）</li>
<li><a href="https://en.wikipedia.org/wiki/Adam_Ondra" target="_blank" rel="noopener noreferrer">Wikipedia - Adam Ondra</a>（生平與成就）</li>
<li><a href="https://en.wikipedia.org/wiki/Janja_Garnbret" target="_blank" rel="noopener noreferrer">Wikipedia - Janja Garnbret</a>（生平與成就）</li>
<li><a href="https://en.wikipedia.org/wiki/Alex_Honnold" target="_blank" rel="noopener noreferrer">Wikipedia - Alex Honnold</a>（生平與成就）</li>
<li><a href="https://en.wikipedia.org/wiki/Tommy_Caldwell" target="_blank" rel="noopener noreferrer">Wikipedia - Tommy Caldwell</a>（生平與成就）</li>
<li><a href="https://en.wikipedia.org/wiki/Chris_Sharma" target="_blank" rel="noopener noreferrer">Wikipedia - Chris Sharma</a>（生平與成就）</li>
<li><a href="https://olympics.com/en/paris-2024/results/sport-climbing" target="_blank" rel="noopener noreferrer">Paris 2024 Olympics - Sport Climbing Results</a>（奧運成績）</li>
<li><a href="https://www.climbing.com/people/" target="_blank" rel="noopener noreferrer">Climbing Magazine - People</a>（選手專訪）</li>
<li><a href="https://www.8a.nu/" target="_blank" rel="noopener noreferrer">8a.nu</a>（戶外攀登紀錄資料庫）</li>
<li><a href="https://www.ispo.com/news-article/sports-business/alberto-gines-lopez-janja-garnbret-alex-honnold-the-ten-strongest-climbers-in-the-world" target="_blank" rel="noopener noreferrer">ISPO - 世界十強攀岩選手</a>（選手排名參考）</li>
</ul>',
  NULL,
  'community',
  'published',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

DELETE FROM post_tags WHERE post_id = 'post_community_top_climbers';
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', '選手');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', '攀岩名人');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', 'Adam Ondra');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_top_climbers', 'Janja Garnbret');

-- 3. 攀岩運動發展史 (約 5,500 字)
INSERT OR REPLACE INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_climbing_history',
  'nobodyclimb_staff_account_001',
  '攀岩運動發展史：從登山附屬到奧運項目',
  'history-of-rock-climbing',
  '從 1492 年的 Mont Aiguille 到 2024 年巴黎奧運，攀岩運動經歷了怎樣的演變？本文帶你回顧攀岩運動超過 500 年的發展歷程。',
  '<h2>前言</h2>
<p>攀岩運動從最初作為登山訓練的附屬活動，發展成為擁有數千萬愛好者的獨立運動項目，並在 2020 年正式成為奧林匹克運動會的比賽項目。這段超過 500 年的歷史，不僅是技術與裝備的演進，更是人類挑戰自然、追求極限的精神史。</p>
<p>本文將帶你回顧這段精彩的歷史，從最早有記錄的攀登活動，到現代競技攀岩的蓬勃發展，認識那些推動攀岩運動發展的關鍵人物與里程碑事件。</p>

<h2>早期攀登活動（1492-1800s）</h2>

<h3>有記錄的最早攀登</h3>
<p><strong>1492 年 — Mont Aiguille</strong></p>
<p>人類歷史上第一次有明確記錄的技術性攀登發生在 1492 年。法國國王查理八世命令他的侍從 Antoine de Ville 攀登 Mont Aiguille，這是一座位於法國阿爾卑斯山區的石灰岩孤峰，四面都是陡峭的懸崖。De Ville 率領團隊使用梯子和其他工具，成功登頂這座被認為「無法攀登」的山峰。</p>
<p>這次攀登被視為「登山運動的起源」，雖然嚴格來說這更接近於探險而非現代意義的攀岩，但它開啟了人類征服高峰的歷史。</p>

<h3>阿爾卑斯黃金時代（1854-1865）</h3>
<p>19 世紀中葉，歐洲掀起了攀登阿爾卑斯山脈的熱潮：</p>
<ul>
<li><strong>1786 年</strong>：Michel-Gabriel Paccard 與 Jacques Balmat 首登白朗峰（Mont Blanc，4,808 公尺），歐洲最高峰</li>
<li><strong>1854-1865 年</strong>：被稱為「阿爾卑斯黃金時代」，幾乎所有主要山峰都在這段時間首登</li>
<li><strong>1865 年</strong>：Edward Whymper 團隊首登馬特洪峰（Matterhorn），但下撤時 4 人墜亡，成為登山史上著名的悲劇</li>
</ul>
<p>在這個時期，攀岩主要作為登山的附屬技術存在。登山者需要攀爬岩石段落才能到達山頂，但這不被視為獨立的運動。</p>

<h2>攀岩獨立發展期（1880s-1950s）</h2>

<h3>攀岩作為獨立運動的誕生</h3>
<p><strong>英國湖區與蘇格蘭</strong></p>
<ul>
<li><strong>1886 年</strong>：Walter Parry Haskett Smith 獨自攀登英國湖區的 Napes Needle，這次純粹為了攀岩本身而進行的攀登，被許多人視為「運動攀岩的起點」</li>
<li>攀岩開始從「登頂的手段」轉變為「攀爬本身的樂趣」</li>
</ul>

<p><strong>德國薩克森地區</strong></p>
<ul>
<li><strong>1890 年代</strong>：德國薩克森地區（Saxony）的砂岩塔群成為攀岩聖地</li>
<li>當地攀岩者發展出早期的攀岩倫理與規則，包括禁止使用岩釘等人工輔助</li>
<li>這些規則影響了後來的「自由攀登」理念</li>
</ul>

<h3>楓丹白露的抱石傳統</h3>
<p>法國巴黎近郊的楓丹白露（Fontainebleau）是抱石運動的發源地：</p>
<ul>
<li><strong>1900 年代初</strong>：巴黎的登山者開始在楓丹白露的砂岩上練習攀爬技術</li>
<li><strong>1930 年代</strong>：Pierre Allain 等先驅者發展出系統化的抱石訓練方法</li>
<li><strong>1947 年</strong>：Allain 發明了第一雙專門設計的攀岩鞋（具有橡膠鞋底）</li>
<li><strong>1950 年代</strong>：楓丹白露已成為歐洲最重要的攀岩訓練場地，其難度等級系統（Fontainebleau grade）至今仍被廣泛使用</li>
</ul>

<h3>技術與裝備的演進</h3>
<table>
<thead><tr><th>年代</th><th>重要發展</th></tr></thead>
<tbody>
<tr><td>1910 年代</td><td>金屬岩釘（piton）開始被使用於保護</td></tr>
<tr><td>1920-30 年代</td><td>登山繩技術改進，使用天然纖維繩</td></tr>
<tr><td>1940 年代</td><td>鉤環（carabiner）普及化</td></tr>
<tr><td>1947 年</td><td>Pierre Allain 發明橡膠底攀岩鞋</td></tr>
<tr><td>1950 年代</td><td>尼龍繩取代天然纖維繩，強度與安全性大幅提升</td></tr>
</tbody>
</table>

<h2>優勝美地時代（1950s-1970s）</h2>

<h3>優勝美地的崛起</h3>
<p>美國加州的優勝美地國家公園（Yosemite National Park）在 1950 年代成為世界攀岩的中心：</p>

<p><strong>The Nose 首攀（1958）</strong></p>
<p>酋長岩（El Capitan）是一塊高約 900 公尺的花崗岩巨石，The Nose 是其最明顯的路線。1958 年，Warren Harding 帶領團隊以「圍城」方式首攀這條路線：</p>
<ul>
<li>總共花費 47 天（分多次進行）</li>
<li>使用 125 支岩釘和 3,000 多個膨脹螺栓</li>
<li>這是大岩壁攀登的開創性成就</li>
</ul>

<p><strong>風格之爭</strong></p>
<p>Warren Harding 與 Royal Robbins 代表了兩種不同的攀登哲學：</p>
<ul>
<li><strong>Harding</strong>：「只要能登頂，手段不重要」</li>
<li><strong>Robbins</strong>：倡導「公平手段」（fair means），減少對岩壁的破壞，強調攀登倫理</li>
</ul>
<p>這場爭論影響深遠，最終「乾淨攀登」的理念成為主流，現代攀岩倫理的基礎由此奠定。</p>

<h3>重要人物</h3>
<ul>
<li><strong>Royal Robbins</strong>：乾淨攀登的倡導者，完成多條優勝美地經典路線</li>
<li><strong>Warren Harding</strong>：大岩壁攀登的開創者</li>
<li><strong>Yvon Chouinard</strong>：攀岩裝備革命的推動者，發明可移除的岩楔，後創立 Patagonia 戶外品牌</li>
</ul>

<h2>自由攀岩革命（1970s-1980s）</h2>

<h3>什麼是「自由攀岩」</h3>
<p>「自由攀岩」（Free Climbing）這個詞常被誤解。它指的不是「沒有繩索」，而是：</p>
<ul>
<li><strong>自由攀登</strong>：僅用身體力量（手、腳）向上移動，器材只用於保護（墜落時使用）</li>
<li><strong>人工攀登</strong>（Aid Climbing）：依靠岩釘、繩梯等器械向上移動</li>
<li><strong>無保護獨攀</strong>（Free Solo）：不使用任何繩索或保護，這才是最危險的形式</li>
</ul>

<h3>Stonemasters 時代</h3>
<p>1970 年代的優勝美地，一群年輕攀岩者形成了傳奇的 Stonemasters 團體：</p>
<ul>
<li><strong>代表人物</strong>：John Bachar、Ron Kauk、Lynn Hill、John Long</li>
<li><strong>生活方式</strong>：住在營地、靠微薄收入過活、與國家公園管理員周旋</li>
<li><strong>文化特色</strong>：嬉皮精神、反主流文化、追求純粹的攀岩體驗</li>
</ul>
<p>這群攀岩者將自由攀登推向新的高度，許多在那個年代被認為「不可能自由攀登」的路線，都被他們逐一征服。</p>

<h3>Lynn Hill 的歷史性突破</h3>
<p>Lynn Hill 是攀岩史上最重要的女性攀岩者之一：</p>
<ul>
<li><strong>1993 年</strong>：首次自由攀登酋長岩 The Nose，這是男女通算的首攀</li>
<li><strong>1994 年</strong>：以一天之內完成 The Nose 的自由攀登，再次創造歷史</li>
<li><strong>名言</strong>：「It goes, boys.」（男孩們，這條路線可以被自由攀登）</li>
</ul>
<p>她的成就證明了女性在攀岩領域的無限可能，打破了當時普遍存在的性別偏見。</p>

<h3>難度等級的演進</h3>
<table>
<thead><tr><th>年份</th><th>選手</th><th>路線</th><th>難度</th><th>意義</th></tr></thead>
<tbody>
<tr><td>1979</td><td>Ray Jardine</td><td>Phoenix</td><td>5.13a</td><td>首條 5.13</td></tr>
<tr><td>1988</td><td>Wolfgang Güllich</td><td>Wallstreet</td><td>5.14a</td><td>首條 5.14</td></tr>
<tr><td>1991</td><td>Wolfgang Güllich</td><td>Action Directe</td><td>5.14d (9a)</td><td>首條 9a</td></tr>
</tbody>
</table>

<h3>運動攀登的興起</h3>
<p>1980 年代，法國引領了「運動攀登」（Sport Climbing）革命：</p>
<ul>
<li><strong>膨脹螺栓</strong>（bolt）的使用：提前在岩壁上打好固定點，讓攀岩者可以專注於攀爬動作</li>
<li><strong>室內攀岩牆</strong>：1964 年英國里茲大學的 Don Robinson 建造了第一面室內攀岩牆，但直到 1980 年代才開始普及</li>
<li><strong>商業攀岩館</strong>：1987 年，美國西雅圖的 Vertical World 成為第一家商業攀岩館</li>
</ul>

<h2>競技攀岩時代（1990s-2010s）</h2>

<h3>國際比賽的誕生</h3>
<ul>
<li><strong>1985 年</strong>：義大利巴乾涅（Bardonecchia）舉辦首場國際先鋒攀登比賽</li>
<li><strong>1989 年</strong>：首屆攀岩世界盃在法國舉行</li>
<li><strong>1991 年</strong>：首屆世界錦標賽舉辦</li>
<li><strong>1998 年</strong>：抱石成為獨立的比賽項目</li>
<li><strong>2007 年</strong>：IFSC（國際運動攀登總會）正式成立，統一管理全球競技攀岩</li>
</ul>

<h3>難度持續推進</h3>
<table>
<thead><tr><th>年份</th><th>選手</th><th>路線</th><th>難度</th></tr></thead>
<tbody>
<tr><td>2001</td><td>Chris Sharma</td><td>Realization</td><td>9a+ (5.15a)</td></tr>
<tr><td>2008</td><td>Chris Sharma</td><td>Jumbo Love</td><td>9b (5.15b)</td></tr>
<tr><td>2012</td><td>Adam Ondra</td><td>Change</td><td>9b+ (5.15c)</td></tr>
<tr><td>2017</td><td>Adam Ondra</td><td>Silence</td><td>9c (5.15d)</td></tr>
</tbody>
</table>

<h3>室內攀岩的蓬勃發展</h3>
<p>進入 21 世紀，室內攀岩館在全球快速擴張：</p>
<ul>
<li><strong>連鎖品牌興起</strong>：Climbing Walls 等連鎖攀岩館擴展</li>
<li><strong>抱石館文化</strong>：入門門檻低、社交性強，吸引大量新手</li>
<li><strong>攀岩人口成長</strong>：全球攀岩人口估計超過 4,500 萬</li>
</ul>

<h2>奧運時代（2016-至今）</h2>

<h3>進入奧運的歷程</h3>
<ul>
<li><strong>2016 年 8 月</strong>：國際奧委會正式宣布將攀岩納入 2020 東京奧運</li>
<li><strong>賽制爭議</strong>：為了控制獎牌數，三項（先鋒、抱石、速度）被合併為一個項目，引發專項選手的不滿</li>
<li><strong>攀岩界態度分歧</strong>：有人認為奧運會帶來更多資源與關注，有人擔心商業化會改變攀岩文化</li>
</ul>

<h3>2020 東京奧運（2021 年舉行）</h3>
<p><strong>賽制</strong>：三項全能（先鋒、抱石、速度），三項排名相乘計算總分</p>
<p><strong>金牌得主</strong>：</p>
<ul>
<li>男子：Alberto Ginés López（西班牙）</li>
<li>女子：Janja Garnbret（斯洛維尼亞）</li>
</ul>
<p><strong>影響</strong>：全球媒體大幅報導，攀岩運動獲得前所未有的曝光度</p>

<h3>2024 巴黎奧運</h3>
<p><strong>賽制改革</strong>：</p>
<ul>
<li>速度攀岩獨立成項</li>
<li>先鋒與抱石合併為「複合賽」</li>
<li>獎牌數從 2 面增加到 4 面</li>
</ul>
<p><strong>金牌得主</strong>：</p>
<ul>
<li>男子速度：Veddriq Leonardo（印尼）</li>
<li>女子速度：Aleksandra Miroslaw（波蘭）— 以破世界紀錄的 6.06 秒奪冠</li>
<li>男子複合：Toby Roberts（英國）</li>
<li>女子複合：Janja Garnbret（斯洛維尼亞）— 成功衛冕</li>
</ul>

<h2>攀岩在台灣的發展</h2>

<h3>早期發展（1980s-2000s）</h3>
<ul>
<li><strong>1980 年代</strong>：攀岩運動開始傳入台灣</li>
<li><strong>1990 年代</strong>：龍洞成為台灣最重要的戶外攀岩場地</li>
<li><strong>攀岩協會成立</strong>：中華民國山岳協會開始推動攀岩運動</li>
</ul>

<h3>重要場地</h3>
<ul>
<li><strong>龍洞</strong>：位於新北市貢寮區，台灣最知名的戶外攀岩場地，擁有豐富的海蝕岩壁</li>
<li><strong>關子嶺</strong>：南部重要的戶外攀岩區域</li>
<li><strong>大砲岩</strong>：台北陽明山區的攀岩場地</li>
</ul>

<h3>近年發展（2010s-至今）</h3>
<ul>
<li><strong>室內岩館蓬勃發展</strong>：台北、台中、高雄等城市都有多家專業抱石館</li>
<li><strong>奧運效應</strong>：2020 年後攀岩人口快速成長</li>
<li><strong>國際賽事參與</strong>：台灣選手持續參加亞洲錦標賽與世界盃</li>
</ul>

<h2>攀岩發展重要年表</h2>
<table>
<thead><tr><th>年份</th><th>事件</th></tr></thead>
<tbody>
<tr><td>1492</td><td>Antoine de Ville 攀登 Mont Aiguille（有記錄的最早技術攀登）</td></tr>
<tr><td>1786</td><td>白朗峰首攀</td></tr>
<tr><td>1886</td><td>Haskett Smith 攀登 Napes Needle（運動攀岩起點）</td></tr>
<tr><td>1947</td><td>Pierre Allain 發明橡膠底攀岩鞋</td></tr>
<tr><td>1958</td><td>Warren Harding 首攀 The Nose</td></tr>
<tr><td>1964</td><td>首座室內攀岩牆（英國里茲大學）</td></tr>
<tr><td>1987</td><td>美國首家商業攀岩館（西雅圖 Vertical World）</td></tr>
<tr><td>1989</td><td>首屆攀岩世界盃</td></tr>
<tr><td>1991</td><td>Wolfgang Güllich 完攀首條 9a（Action Directe）</td></tr>
<tr><td>1993</td><td>Lynn Hill 自由攀登 The Nose</td></tr>
<tr><td>2001</td><td>Chris Sharma 完攀首條 9a+（Realization）</td></tr>
<tr><td>2007</td><td>IFSC 成立</td></tr>
<tr><td>2012</td><td>Adam Ondra 完攀首條 9b+（Change）</td></tr>
<tr><td>2016</td><td>攀岩確定納入 2020 奧運</td></tr>
<tr><td>2017</td><td>Adam Ondra 完攀首條 9c（Silence）</td></tr>
<tr><td>2017</td><td>Alex Honnold 無保護獨攀酋長岩</td></tr>
<tr><td>2021</td><td>首屆奧運攀岩比賽（東京）</td></tr>
<tr><td>2024</td><td>巴黎奧運攀岩比賽（賽制改革）</td></tr>
</tbody>
</table>

<h2>未來展望</h2>

<h3>攀岩運動的趨勢</h3>
<ul>
<li><strong>人口持續成長</strong>：預估全球攀岩人口將持續增加</li>
<li><strong>商業化發展</strong>：更多連鎖攀岩館興起，設施越來越專業</li>
<li><strong>科技應用</strong>：訓練數據分析、穿戴裝置、VR 攀岩體驗</li>
<li><strong>永續攀岩</strong>：環境保護意識提升，減少對自然岩壁的影響</li>
</ul>

<h3>2028 洛杉磯奧運</h3>
<p>攀岩將繼續作為奧運項目，預期會維持巴黎賽制。洛杉磯作為美國攀岩重鎮，屆時的比賽將備受關注。</p>

<h2>結語</h2>
<p>從 1492 年的 Mont Aiguille 到 2024 年的巴黎奧運，攀岩運動經歷了超過 500 年的演變。這項運動不僅考驗體能與技術，更體現了人類挑戰極限、追求自我突破的精神。</p>
<p>每一位站在岩壁前的攀岩者，無論程度高低，都是這段歷史的一部分。當你抓住第一個岩點、完成第一條路線時，你正在延續這項運動數百年來的傳統。</p>
<p>讓我們期待攀岩運動更精彩的未來，也期待更多精彩的故事等待被書寫。</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://en.wikipedia.org/wiki/History_of_rock_climbing" target="_blank" rel="noopener noreferrer">Wikipedia - History of Rock Climbing</a>（綜合歷史參考）</li>
<li><a href="https://hiking.biji.co/index.php?q=news&act=info&id=13086" target="_blank" rel="noopener noreferrer">健行筆記 - 攀岩歷史</a>（中文歷史資料）</li>
<li><a href="https://www.ifsc-climbing.org/about" target="_blank" rel="noopener noreferrer">IFSC 官網 - About</a>（競技攀岩歷史）</li>
<li><a href="https://en.wikipedia.org/wiki/Yosemite_climbing" target="_blank" rel="noopener noreferrer">Wikipedia - Yosemite Climbing</a>（優勝美地攀岩史）</li>
<li><a href="https://en.wikipedia.org/wiki/Lynn_Hill" target="_blank" rel="noopener noreferrer">Wikipedia - Lynn Hill</a>（Lynn Hill 生平）</li>
<li><a href="https://en.wikipedia.org/wiki/Stonemasters" target="_blank" rel="noopener noreferrer">Wikipedia - Stonemasters</a>（Stonemasters 歷史）</li>
<li><a href="https://olympics.com/en/sports/sport-climbing/" target="_blank" rel="noopener noreferrer">Olympics.com - Sport Climbing</a>（奧運攀岩資訊）</li>
<li><a href="https://www.climbing.org.tw/" target="_blank" rel="noopener noreferrer">中華民國山岳協會</a>（台灣攀岩資訊）</li>
<li><a href="https://americanalpineclub.org/" target="_blank" rel="noopener noreferrer">American Alpine Club</a>（美國攀岩歷史）</li>
<li>紀錄片《Valley Uprising》（優勝美地攀岩史參考）</li>
</ul>',
  NULL,
  'community',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

DELETE FROM post_tags WHERE post_id = 'post_community_climbing_history';
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '攀岩歷史');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '攀岩文化');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '優勝美地');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_history', '奧運');

-- 4. 攀岩必讀書籍推薦 (約 3,500 字)
INSERT OR REPLACE INTO posts (id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at, created_at, updated_at)
VALUES (
  'post_community_climbing_books',
  'nobodyclimb_staff_account_001',
  '攀岩必讀書籍推薦',
  'must-read-climbing-books',
  '從《攀岩聖經》到《The Rock Warrior''s Way》，精選技術訓練、心理建設與攀岩故事類書籍，助你從閱讀中提升攀岩實力。',
  '<h2>前言</h2>
<p>攀岩不只是身體的運動，更是心智的修煉。透過閱讀，我們能學習前人的智慧、了解科學化的訓練方法、培養正確的心理素質。相較於影片，書籍能提供更深入、更系統化的知識，讓你在岩壁上的每一步都更有依據。</p>
<p>本文精選技術訓練、心理建設、傳記故事三大類書籍，無論你是剛入門的新手，還是追求突破的進階攀岩者，都能從中找到適合自己的讀物。</p>

<h2>繁體中文書籍</h2>

<h3>一攀就上手：基礎攀岩一次就學會</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：李虹瑩</li>
<li><strong>出版社</strong>：墨刻</li>
<li><strong>出版年份</strong>：2022 年</li>
<li><strong>ISBN</strong>：9789862898314</li>
<li><strong>頁數</strong>：約 200 頁</li>
<li><strong>定價</strong>：約 NT$380</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>這是一本專為台灣讀者撰寫的入門攀岩書籍。作者李虹瑩是台灣頂尖攀岩選手，曾多次代表台灣參加國際賽事，也是知名的攀岩教練。書中內容涵蓋：</p>
<ul>
<li>攀岩基礎知識與安全觀念</li>
<li>抱石與上攀的基本技術</li>
<li>裝備選購指南（適合台灣購買管道）</li>
<li>台灣攀岩場地介紹</li>
<li>訓練方法與進階技巧</li>
<li>常見問題 Q&A</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li><strong>繁體中文原創</strong>：不是翻譯書，閱讀流暢無障礙</li>
<li><strong>貼近台灣環境</strong>：書中提到的場地、裝備購買管道都適用於台灣</li>
<li><strong>專業可靠</strong>：由頂尖選手兼教練撰寫，內容經過實戰驗證</li>
<li><strong>圖文並茂</strong>：大量照片與圖解，適合視覺學習</li>
</ul>

<p><strong>適合讀者</strong></p>
<p>完全新手、想了解台灣攀岩環境的讀者、攀岩教練參考</p>

<p><strong>購買管道</strong></p>
<p>博客來、誠品、金石堂等各大書店</p>

<h3>攀岩聖經（How to Climb 5.12）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>原著作者</strong>：Eric J. Hörst</li>
<li><strong>譯者</strong>：謝伊伶</li>
<li><strong>出版社</strong>：臉譜</li>
<li><strong>ISBN</strong>：9789862358153</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>《How to Climb 5.12》是攀岩訓練領域的經典之作，已被翻譯成多國語言。原作者 Eric J. Hörst 是美國知名的攀岩教練與作家，本書涵蓋：</p>
<ul>
<li>攀岩體能訓練的科學原理</li>
<li>力量與耐力的平衡發展</li>
<li>技術動作的分析與改進</li>
<li>心理訓練與恐懼克服</li>
<li>受傷預防與恢復</li>
<li>訓練計畫的設計與調整</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>台灣少數有中文翻譯的經典攀岩訓練書</li>
<li>內容紮實且經過時間考驗</li>
<li>從 5.10 到 5.12 的完整訓練指南</li>
<li>適合想系統性提升的攀岩者</li>
</ul>

<p><strong>適合讀者</strong></p>
<p>中階攀岩者（穩定爬 5.10-5.11）、想突破瓶頸的愛好者</p>

<h2>英文技術書籍</h2>

<h3>Training for Climbing（第四版）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Eric J. Hörst</li>
<li><strong>出版社</strong>：Falcon Guides</li>
<li><strong>出版年份</strong>：2022 年（第四版）</li>
<li><strong>頁數</strong>：384 頁</li>
<li><strong>定價</strong>：約 US$30</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>這是《攀岩聖經》作者 Eric J. Hörst 的進階著作，內容比中譯版更新、更完整：</p>
<ul>
<li>最新的運動科學研究應用</li>
<li>詳細的力量訓練方法（包含指力板、校園板訓練）</li>
<li>耐力與恢復的科學原理</li>
<li>營養與睡眠對表現的影響</li>
<li>完整的訓練週期規劃（週期化訓練）</li>
<li>受傷預防與康復指南</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>攀岩訓練領域的權威著作，不斷更新改版</li>
<li>結合最新運動科學研究</li>
<li>詳細的訓練計畫範例，可直接應用</li>
<li>比中譯版更新、更完整</li>
</ul>

<p><strong>適合讀者</strong></p>
<p>認真訓練的中高階攀岩者、攀岩教練與訓練師</p>

<h3>The Rock Warrior''s Way</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Arno Ilgner</li>
<li><strong>出版社</strong>：Desiderata Institute</li>
<li><strong>出版年份</strong>：2003 年</li>
<li><strong>頁數</strong>：192 頁</li>
<li><strong>定價</strong>：約 US$17</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>這是一本專門探討攀岩心理學的開創性著作，作者將武術哲學與攀岩結合：</p>
<ul>
<li>理解恐懼的本質與來源</li>
<li>注意力與專注的訓練方法</li>
<li>自我對話與心理模式的調整</li>
<li>風險評估與決策過程</li>
<li>「戰士精神」在攀岩中的應用</li>
<li>從恐懼中學習與成長</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>攀岩心理學的開創性著作</li>
<li>提供獨特的心理訓練方法</li>
<li>幫助克服攀岩中的心理障礙</li>
<li>適用於各級別攀岩者</li>
<li>許多頂尖選手推薦</li>
</ul>

<p><strong>適合讀者</strong></p>
<p>常因心理因素影響表現的攀岩者、對攀岩哲學有興趣的讀者</p>

<h3>The Climbing Bible</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Martin Mobråten、Stian Christophersen</li>
<li><strong>出版社</strong>：Vertebrate Publishing</li>
<li><strong>出版年份</strong>：2020 年</li>
<li><strong>頁數</strong>：352 頁</li>
<li><strong>定價</strong>：約 US$40</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>由挪威國家攀岩隊教練撰寫的現代攀岩訓練全書：</p>
<ul>
<li>技術動作的詳細分析（含大量彩色圖片）</li>
<li>體能訓練的科學方法</li>
<li>心理準備與比賽策略</li>
<li>營養與恢復</li>
<li>受傷預防</li>
<li>訓練計畫範例</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>資訊最新、最完整的攀岩訓練書</li>
<li>大量彩色圖片與圖表，視覺化程度高</li>
<li>由頂級國家隊教練撰寫，專業可靠</li>
<li>涵蓋技術、體能、心理、營養全方位</li>
<li>適合作為長期參考書</li>
</ul>

<p><strong>適合讀者</strong></p>
<p>所有級別的攀岩者、想全面了解現代攀岩訓練的讀者</p>

<h2>傳記與故事類</h2>

<h3>The Push（Tommy Caldwell 自傳）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Tommy Caldwell</li>
<li><strong>出版社</strong>：Viking</li>
<li><strong>出版年份</strong>：2017 年</li>
<li><strong>頁數</strong>：400 頁</li>
<li><strong>定價</strong>：約 US$18</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>Tommy Caldwell 的人生故事，比任何虛構小說都精彩：</p>
<ul>
<li>2000 年在吉爾吉斯坦被武裝分子綁架的驚險經歷</li>
<li>失去一根手指後如何重新學習攀岩</li>
<li>婚姻的破裂與重建</li>
<li>花費 7 年準備 Dawn Wall 的艱辛歷程</li>
<li>與 Kevin Jorgeson 搭檔的 19 天攀登</li>
<li>關於堅持、失敗與重新開始的人生智慧</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>紀錄片《The Dawn Wall》的完整文字版，有更多細節</li>
<li>堅韌精神的最佳詮釋</li>
<li>不只是攀岩書，更是人生勵志傳記</li>
<li>文筆流暢，引人入勝</li>
</ul>

<h3>Alone on the Wall（Alex Honnold 自傳）</h3>
<p><strong>書籍資訊</strong></p>
<ul>
<li><strong>作者</strong>：Alex Honnold、David Roberts</li>
<li><strong>出版社</strong>：W. W. Norton</li>
<li><strong>出版年份</strong>：2015 年（擴充版 2018 年）</li>
<li><strong>頁數</strong>：約 250 頁</li>
</ul>

<p><strong>內容簡介</strong></p>
<p>Alex Honnold 親自講述他的無繩獨攀生涯：</p>
<ul>
<li>成長背景與攀岩啟蒙</li>
<li>獨攀的心理準備與風險管理哲學</li>
<li>Half Dome、Moonlight Buttress 等經典獨攀的詳細記錄</li>
<li>2018 年擴充版包含 El Capitan 獨攀的完整記述</li>
<li>對恐懼、風險與人生意義的思考</li>
</ul>

<p><strong>推薦理由</strong></p>
<ul>
<li>深入了解《Free Solo》主角的內心世界</li>
<li>紀錄片的文字補充，有更多背景資訊</li>
<li>探討風險、熱情與人生選擇</li>
<li>文字平實真誠，沒有過度美化</li>
</ul>

<h3>Valley of Giants</h3>
<p><strong>內容簡介</strong></p>
<p>優勝美地攀岩史的深度報導，與紀錄片《Valley Uprising》互為補充。書中深入描述 1950-2010 年代優勝美地攀岩文化的演變，包含許多第一手訪談與珍貴照片。</p>

<h2>閱讀建議</h2>

<h3>依程度選擇</h3>
<table>
<thead><tr><th>程度</th><th>推薦書籍</th><th>原因</th></tr></thead>
<tbody>
<tr><td>初學者</td><td>一攀就上手</td><td>中文、貼近台灣環境、基礎全面</td></tr>
<tr><td>中階（5.10-5.11）</td><td>攀岩聖經、The Rock Warrior''s Way</td><td>系統性訓練、心理建設</td></tr>
<tr><td>進階（5.12+）</td><td>Training for Climbing、The Climbing Bible</td><td>最新科學訓練方法</td></tr>
</tbody>
</table>

<h3>依需求選擇</h3>
<table>
<thead><tr><th>需求</th><th>推薦書籍</th></tr></thead>
<tbody>
<tr><td>體能訓練</td><td>Training for Climbing、The Climbing Bible</td></tr>
<tr><td>技術改進</td><td>The Climbing Bible</td></tr>
<tr><td>心理訓練</td><td>The Rock Warrior''s Way</td></tr>
<tr><td>找靈感/故事</td><td>The Push、Alone on the Wall</td></tr>
<tr><td>了解文化</td><td>Valley of Giants</td></tr>
</tbody>
</table>

<h3>建議閱讀順序</h3>
<ol>
<li><strong>入門書</strong>：先讀《一攀就上手》建立基礎觀念</li>
<li><strong>心理書籍</strong>：接著讀《The Rock Warrior''s Way》建立正確心態</li>
<li><strong>訓練書籍</strong>：根據自己的弱點選擇《攀岩聖經》或英文進階書</li>
<li><strong>傳記故事</strong>：閱讀《The Push》等傳記保持熱情與動力</li>
</ol>

<h2>購書指南</h2>

<h3>繁體中文書籍</h3>
<ul>
<li><strong>博客來</strong>：最方便的線上購書平台</li>
<li><strong>誠品</strong>：可現場翻閱再決定購買</li>
<li><strong>讀冊生活</strong>：二手書選擇，價格較便宜</li>
</ul>

<h3>英文書籍</h3>
<ul>
<li><strong>Amazon</strong>：選擇最豐富，可看評價</li>
<li><strong>Kindle</strong>：電子書選項，立即閱讀、攜帶方便</li>
<li><strong>圖書館</strong>：部分大學圖書館有收藏，可免費借閱</li>
</ul>

<h2>結語</h2>
<p>閱讀是提升攀岩能力的重要途徑之一。透過前人的經驗與智慧，我們能少走彎路、更快進步。但請記住，書中的知識需要在岩壁上實踐才能真正內化。</p>
<p>最好的學習方式是：讀一章、練一週、再回來讀。讓書本成為你的教練，但岩壁才是你的老師。</p>
<p>希望這份書單能幫助你找到適合的讀物，在閱讀與攀爬中持續成長！</p>

<h2>參考來源</h2>
<ul>
<li><a href="https://www.books.com.tw/products/0010924603" target="_blank" rel="noopener noreferrer">博客來 - 一攀就上手</a>（書籍資訊）</li>
<li><a href="https://www.amazon.com/Training-Climbing-Definitive-Improving-Performance/dp/1493056778" target="_blank" rel="noopener noreferrer">Amazon - Training for Climbing</a>（書籍資訊與評價）</li>
<li><a href="https://www.amazon.com/Rock-Warriors-Way-Training-Climbers/dp/0974011215" target="_blank" rel="noopener noreferrer">Amazon - The Rock Warrior''s Way</a>（書籍資訊與評價）</li>
<li><a href="https://www.amazon.com/Climbing-Bible-Technical-Tactical-Training/dp/1839810025" target="_blank" rel="noopener noreferrer">Amazon - The Climbing Bible</a>（書籍資訊與評價）</li>
<li><a href="https://www.goodreads.com/book/show/32197428-the-push" target="_blank" rel="noopener noreferrer">Goodreads - The Push</a>（書籍評價）</li>
<li><a href="https://www.goodreads.com/book/show/25814089-alone-on-the-wall" target="_blank" rel="noopener noreferrer">Goodreads - Alone on the Wall</a>（書籍評價）</li>
<li><a href="https://www.climbing.com/skills/9-climbing-books-that-will-make-you-a-better-climber/" target="_blank" rel="noopener noreferrer">Climbing Magazine - 9 Climbing Books</a>（書籍推薦參考）</li>
<li><a href="https://www.99boulders.com/best-climbing-training-books" target="_blank" rel="noopener noreferrer">99 Boulders - Best Climbing Training Books</a>（訓練書籍評選）</li>
</ul>',
  NULL,
  'community',
  'published',
  0,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

DELETE FROM post_tags WHERE post_id = 'post_community_climbing_books';
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '書籍');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '學習資源');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '訓練');
INSERT INTO post_tags (post_id, tag) VALUES ('post_community_climbing_books', '攀岩文化');
