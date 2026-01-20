const fs = require('fs');
const path = require('path');

/**
 * 生成影片分塊資料
 *
 * 將 videos.json 分割成多個 chunks 以提升前端載入效能
 * 同時生成 videos-meta.json 和 featured-videos.json
 */

const PUBLIC_DATA_DIR = 'public/data';
const VIDEOS_FILE = path.join(PUBLIC_DATA_DIR, 'videos.json');
const META_FILE = path.join(PUBLIC_DATA_DIR, 'videos-meta.json');
const FEATURED_FILE = path.join(PUBLIC_DATA_DIR, 'featured-videos.json');
const CHUNKS_DIR = path.join(PUBLIC_DATA_DIR, 'videos-chunks');

// 每個 chunk 的影片數量
const CHUNK_SIZE = 500;

/**
 * 將完整影片資料轉換為列表所需的精簡格式
 */
function toListItem(video) {
  return {
    id: video.id,
    youtubeId: video.youtubeId,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    channel: video.channel,
    duration: video.duration,
    viewCount: video.viewCount,
    category: video.category
  };
}

/**
 * 主要執行函數
 */
function generateVideoChunks() {
  console.log('🚀 開始生成影片分塊資料...');
  console.log('');

  // 檢查來源檔案是否存在
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ 來源檔案不存在: ${VIDEOS_FILE}`);
    console.error('   請先執行 ./scripts/update-videos.sh 收集影片資料');
    process.exit(1);
  }

  // 讀取完整影片資料
  console.log(`📖 讀取 ${VIDEOS_FILE}...`);
  const videosContent = fs.readFileSync(VIDEOS_FILE, 'utf8');
  const videos = JSON.parse(videosContent);
  console.log(`   ✅ 讀取到 ${videos.length} 部影片`);

  // 確保 chunks 目錄存在
  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true });
    console.log(`📁 建立目錄: ${CHUNKS_DIR}`);
  } else {
    // 清空舊的 chunk 檔案
    const oldFiles = fs.readdirSync(CHUNKS_DIR);
    for (const file of oldFiles) {
      fs.unlinkSync(path.join(CHUNKS_DIR, file));
    }
    console.log(`🧹 清理舊的 chunk 檔案 (${oldFiles.length} 個)`);
  }

  // 生成 chunks
  console.log('');
  console.log('📦 生成分塊檔案...');
  const totalChunks = Math.ceil(videos.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, videos.length);
    const chunk = videos.slice(start, end).map(toListItem);

    const chunkFile = path.join(CHUNKS_DIR, `videos-${i}.json`);
    fs.writeFileSync(chunkFile, JSON.stringify(chunk));
    console.log(`   ✅ videos-${i}.json (${chunk.length} 部影片)`);
  }

  // 收集所有頻道名稱
  const channelsSet = new Set(videos.map(v => v.channel));
  const channels = [...channelsSet].sort();

  // 生成 metadata
  console.log('');
  console.log('📊 生成 metadata...');
  const meta = {
    totalVideos: videos.length,
    chunkSize: CHUNK_SIZE,
    totalChunks: totalChunks,
    channels: channels
  };

  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
  console.log(`   ✅ ${META_FILE}`);

  // 生成精選影片
  console.log('');
  console.log('⭐ 生成精選影片...');
  const featuredVideos = videos.filter(v => v.featured === true);
  fs.writeFileSync(FEATURED_FILE, JSON.stringify(featuredVideos, null, 2));
  console.log(`   ✅ ${FEATURED_FILE} (${featuredVideos.length} 部影片)`);

  // 輸出統計
  console.log('');
  console.log('========================================');
  console.log('🎉 分塊生成完成！');
  console.log('');
  console.log('📊 統計資訊:');
  console.log(`   📹 總影片數: ${videos.length}`);
  console.log(`   📦 分塊數量: ${totalChunks}`);
  console.log(`   📏 每塊大小: ${CHUNK_SIZE}`);
  console.log(`   📺 頻道數量: ${channels.length}`);
  console.log(`   ⭐ 精選影片: ${featuredVideos.length}`);
  console.log('');
  console.log('📂 生成的檔案:');
  console.log(`   - ${META_FILE}`);
  console.log(`   - ${FEATURED_FILE}`);
  console.log(`   - ${CHUNKS_DIR}/videos-0.json ~ videos-${totalChunks - 1}.json`);
  console.log('');

  return {
    totalVideos: videos.length,
    totalChunks,
    channels: channels.length,
    featuredCount: featuredVideos.length
  };
}

// 如果直接執行此腳本
if (require.main === module) {
  try {
    generateVideoChunks();
  } catch (error) {
    console.error('❌ 生成失敗:', error.message);
    process.exit(1);
  }
}

module.exports = { generateVideoChunks, CHUNK_SIZE };
