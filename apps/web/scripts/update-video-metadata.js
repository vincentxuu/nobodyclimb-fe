#!/usr/bin/env node
/**
 * 頻道影片元數據更新腳本
 *
 * 補抓 videos.json 中缺少的元數據（uploadDate, likeCount, tags 等）
 * 支援斷點續傳：只會更新缺少資料的影片
 * 支援分批處理：適合在 GitHub Actions 中分批執行
 *
 * 使用方式：
 *   cd apps/web
 *   node scripts/update-video-metadata.js
 *
 * 選項：
 *   --dry-run      只顯示統計，不實際抓取
 *   --force        強制重新抓取所有影片
 *   --limit N      只抓取前 N 個缺失的影片
 *   --batch N      分批處理，每批 N 個（預設 200）
 *   --regenerate   更新後重新生成 chunks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 路徑設定
const VIDEOS_FILE = path.join(__dirname, '../public/data/videos.json');

// 解析命令列參數
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const shouldRegenerate = args.includes('--regenerate');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;
const batchIndex = args.indexOf('--batch');
const batchSize = batchIndex !== -1 ? parseInt(args[batchIndex + 1], 10) : 200;

/**
 * 格式化上傳日期（YYYYMMDD -> YYYY-MM-DD）
 */
function formatUploadDate(dateString) {
  if (!dateString) return null;

  if (typeof dateString === 'string' && dateString.length === 8) {
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
  }

  return dateString;
}

/**
 * 格式化數量（觀看數、按讚數等）
 */
function formatCount(count) {
  if (!count) return '0';
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

/**
 * 使用 yt-dlp 抓取單個影片的元數據
 */
function fetchVideoMetadata(youtubeId) {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;

  try {
    const result = execSync(
      `yt-dlp --dump-json --no-download "${url}"`,
      {
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    const data = JSON.parse(result);

    return {
      publishedAt: formatUploadDate(data.upload_date),
      likeCount: formatCount(data.like_count),
      viewCount: formatCount(data.view_count),
      tags: data.tags || [],
      categories: data.categories || [],
    };
  } catch (error) {
    const stderr = error.stderr || '';

    if (
      stderr.includes('Video unavailable') ||
      stderr.includes('Private video') ||
      stderr.includes('This video has been removed')
    ) {
      return { error: 'unavailable' };
    }

    console.error(`  ❌ 抓取失敗: ${youtubeId} - ${error.message}`);
    return null;
  }
}

/**
 * 根據 tags 重新分類影片
 */
function categorizeByTags(video) {
  const tags = (video.tags || []).map(t => t.toLowerCase());
  const title = (video.title || '').toLowerCase();
  const allText = [...tags, title].join(' ');

  // 先確認是否是攀岩相關
  const climbingKeywords = ['climbing', 'climber', 'boulder', 'bouldering', 'rock climb', 'crag', 'route', 'lead climb', 'sport climb', 'trad climb'];
  const isClimbingRelated = climbingKeywords.some(kw => allText.includes(kw));

  if (!isClimbingRelated) {
    return '其他';
  }

  // 細分類別
  if (tags.some(t => ['competition', 'contest', 'world cup', 'ifsc', 'championship'].includes(t)) ||
      title.includes('competition') || title.includes('world cup')) {
    return '競技攀岩';
  }

  if (tags.some(t => ['indoor', 'gym', 'climbing gym'].includes(t)) ||
      title.includes('gym') || title.includes('indoor')) {
    return '室內攀岩';
  }

  if (tags.some(t => ['gear', 'equipment', 'shoe', 'harness', 'rope', 'carabiner', 'quickdraw'].includes(t)) ||
      (title.includes('review') && !title.includes('military'))) {
    return '裝備評測';
  }

  if (tags.some(t => ['tutorial', 'technique', 'training', 'how to', 'tips', 'lesson'].includes(t)) ||
      title.includes('tutorial') || title.includes('how to')) {
    return '教學影片';
  }

  if (tags.some(t => ['documentary', 'film', 'movie'].includes(t)) ||
      title.includes('documentary') || title.includes('film')) {
    return '紀錄片';
  }

  if (tags.some(t => ['boulder', 'bouldering', 'v10', 'v11', 'v12', 'v13', 'v14', 'v15', 'v16', 'v17'].includes(t))) {
    return '抱石';
  }

  if (tags.some(t => ['outdoor', 'crag', 'rock', 'multipitch', 'big wall', 'trad', 'sport climb'].includes(t))) {
    return '戶外攀岩';
  }

  // 預設
  return '戶外攀岩';
}

/**
 * 檢查影片是否需要更新
 */
function needsUpdate(video) {
  // 檢查 publishedAt 是否是有效日期（不是今天或預設值）
  const today = new Date().toISOString().split('T')[0];
  const hasValidDate = video.publishedAt && video.publishedAt !== today && video.publishedAt !== '1970-01-01';

  // 檢查 likeCount 是否存在且不是 '0'
  const hasLikeCount = video.likeCount && video.likeCount !== '0';

  return !hasValidDate || !hasLikeCount;
}

/**
 * 主程式
 */
async function main() {
  console.log('🚀 頻道影片元數據更新腳本');
  console.log('');

  // 1. 讀取現有影片資料
  if (!fs.existsSync(VIDEOS_FILE)) {
    console.error(`❌ 找不到檔案: ${VIDEOS_FILE}`);
    process.exit(1);
  }

  const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
  console.log(`📂 讀取到 ${videos.length} 個影片`);

  // 2. 找出需要更新的影片
  const videosToUpdate = isForce
    ? videos
    : videos.filter(needsUpdate);

  console.log(`❓ 需要更新: ${videosToUpdate.length} 個影片`);
  console.log('');

  if (isDryRun) {
    console.log('🔍 Dry run 模式，不實際抓取');
    console.log('');
    console.log('📊 統計摘要:');
    console.log(`   - 總影片數: ${videos.length}`);
    console.log(`   - 需要更新: ${videosToUpdate.length}`);
    console.log(`   - 已完整: ${videos.length - videosToUpdate.length}`);
    return;
  }

  if (videosToUpdate.length === 0) {
    console.log('✅ 所有影片元數據已完整，無需更新');
    return;
  }

  // 3. 抓取缺失的元數據（使用 limit 或 batch size）
  const fetchLimit = limit || (process.env.GITHUB_ACTIONS ? batchSize : null);
  const toFetch = fetchLimit ? videosToUpdate.slice(0, fetchLimit) : videosToUpdate;
  console.log(`🔄 開始更新 ${toFetch.length} 個影片的元數據...`);
  console.log('');

  let successCount = 0;
  let failCount = 0;
  let unavailableCount = 0;

  // 建立 youtubeId 到 video 的映射
  const videoMap = new Map(videos.map(v => [v.youtubeId, v]));

  for (let i = 0; i < toFetch.length; i++) {
    const video = toFetch[i];
    const progress = `[${i + 1}/${toFetch.length}]`;

    process.stdout.write(`${progress} 更新 ${video.youtubeId} (${video.title.substring(0, 30)}...)...`);

    const result = fetchVideoMetadata(video.youtubeId);

    if (result === null) {
      failCount++;
      console.log(' ❌ 失敗');
    } else if (result.error === 'unavailable') {
      unavailableCount++;
      console.log(' ⚠️ 影片不可用');
    } else {
      successCount++;
      // 更新影片資料
      const existingVideo = videoMap.get(video.youtubeId);
      if (existingVideo) {
        existingVideo.publishedAt = result.publishedAt || existingVideo.publishedAt;
        existingVideo.likeCount = result.likeCount;
        existingVideo.viewCount = result.viewCount;
        existingVideo.tags = result.tags;
        // 根據 tags 重新分類
        const newCategory = categorizeByTags({ ...existingVideo, tags: result.tags });
        const oldCategory = existingVideo.category;
        existingVideo.category = newCategory;
        const categoryChanged = oldCategory !== newCategory ? ` (${oldCategory} → ${newCategory})` : '';
        console.log(` ✅ ${result.publishedAt} | 👍 ${result.likeCount}${categoryChanged}`);
      }
    }

    // 每 20 個影片儲存一次（防止中斷時遺失）
    if ((i + 1) % 20 === 0) {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));
      console.log(`   💾 已儲存進度 (${i + 1}/${toFetch.length})`);
    }

    // 加入延遲避免被封鎖
    if (i < toFetch.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 4. 儲存最終結果
  fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

  console.log('');
  console.log('🎉 更新完成！');
  console.log('');
  console.log('📊 結果統計:');
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ⚠️ 影片不可用: ${unavailableCount}`);
  console.log(`   ❌ 失敗: ${failCount}`);
  console.log(`   📊 剩餘需更新: ${videosToUpdate.length - toFetch.length}`);
  console.log('');
  console.log(`📂 已更新: ${VIDEOS_FILE}`);

  // 5. 重新生成 chunks（如果指定）
  if (shouldRegenerate && successCount > 0) {
    console.log('');
    console.log('🔄 重新生成 chunks...');
    try {
      const { generateVideoChunks } = require('./generate-video-chunks');
      generateVideoChunks();
    } catch (error) {
      console.error('❌ 生成 chunks 失敗:', error.message);
    }
  }

  // 輸出 GitHub Actions 需要的資訊
  if (process.env.GITHUB_ACTIONS) {
    const remaining = videosToUpdate.length - toFetch.length;
    console.log('');
    console.log('::set-output name=updated::' + successCount);
    console.log('::set-output name=remaining::' + remaining);
    console.log('::set-output name=has_more::' + (remaining > 0));
  }
}

main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});
