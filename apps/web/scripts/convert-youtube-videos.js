const fs = require('fs')
const path = require('path')
const { normalizeChannelName } = require('./utils')

function convertYouTubeToVideoType(inputFile, outputFile, channelInfo = {}) {
  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    throw new Error(`輸入檔案不存在: ${inputFile}`)
  }

  // Read the YouTube videos JSON file (NDJSON format)
  const fileContent = fs.readFileSync(inputFile, 'utf8')
  const videoData = fileContent
    .trim()
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch (_error) {
        console.warn(`跳過無效的 JSON 行: ${line.substring(0, 50)}...`)
        return null
      }
    })
    .filter(Boolean)

  // Function to format duration from seconds to MM:SS or HH:MM:SS
  function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  // Function to determine duration category
  function getDurationCategory(seconds) {
    if (!seconds) return 'short'
    if (seconds < 300) return 'short' // < 5 minutes
    if (seconds <= 1200) return 'medium' // 5-20 minutes
    return 'long' // > 20 minutes
  }

  // Function to format count (view count, like count, etc.)
  function formatCount(count) {
    if (!count) return '0'
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M'
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K'
    }
    return count.toString()
  }

  // Function to categorize videos based on title/description (可以根據頻道類型自定義)
  function categorizeVideo(title, description = '', channelType = 'climbing') {
    const content = (title + ' ' + description).toLowerCase()

    if (channelType === 'climbing') {
      // 攀岩相關分類
      if (
        content.includes('competition') ||
        content.includes('world cup') ||
        content.includes('championship') ||
        content.includes('contest')
      ) {
        return '競技攀岩'
      }
      if (
        content.includes('indoor') ||
        content.includes('gym') ||
        (content.includes('boulder') && content.includes('gym'))
      ) {
        return '室內攀岩'
      }
      if (
        content.includes('gear') ||
        content.includes('review') ||
        content.includes('equipment') ||
        content.includes('test')
      ) {
        return '裝備評測'
      }
      if (
        content.includes('tutorial') ||
        content.includes('how to') ||
        content.includes('technique') ||
        content.includes('training') ||
        content.includes('lesson')
      ) {
        return '教學影片'
      }
      if (
        content.includes('documentary') ||
        content.includes('story') ||
        content.includes('film') ||
        content.includes('adventure')
      ) {
        return '紀錄片'
      }
      if (content.includes('boulder') || content.includes('bouldering')) {
        return '抱石'
      }
      // Default to outdoor climbing
      return '戶外攀岩'
    } else {
      // 通用分類
      if (content.includes('tutorial') || content.includes('how to') || content.includes('guide')) {
        return '教學'
      }
      if (
        content.includes('review') ||
        content.includes('test') ||
        content.includes('comparison')
      ) {
        return '評測'
      }
      if (content.includes('news') || content.includes('update')) {
        return '新聞'
      }
      return '其他'
    }
  }

  // Function to format upload date
  function formatUploadDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0]

    // Handle YYYYMMDD format from yt-dlp
    if (typeof dateString === 'string' && dateString.length === 8) {
      return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`
    }

    // Handle ISO date string
    if (dateString.includes('T')) {
      return dateString.split('T')[0]
    }

    return dateString
  }

  // Convert each video
  const convertedVideos = videoData.map((video, index) => {
    const duration = formatDuration(video.duration)
    const durationCategory = getDurationCategory(video.duration)
    const viewCount = formatCount(video.view_count)
    const likeCount = formatCount(video.like_count)
    const category = categorizeVideo(
      video.title,
      video.description || '',
      channelInfo.type || 'climbing'
    )

    // Get best thumbnail (highest resolution available)
    const bestThumbnail =
      video.thumbnails && video.thumbnails.length > 0
        ? video.thumbnails[video.thumbnails.length - 1].url
        : `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`

    return {
      id: (index + 1).toString(),
      youtubeId: video.id,
      title: video.title || 'Untitled Video',
      description: video.description || '',
      thumbnailUrl: bestThumbnail,
      channel:
        normalizeChannelName(video.uploader || video.playlist_uploader) ||
        channelInfo.name ||
        'YouTube Channel',
      channelId: video.uploader_id || video.playlist_uploader_id || channelInfo.id || '@channel',
      publishedAt: formatUploadDate(video.upload_date),
      duration: duration,
      durationCategory: durationCategory,
      viewCount: viewCount,
      likeCount: likeCount,
      category: category,
      tags: video.tags || [],
      featured: (video.view_count || 0) > (channelInfo.featuredThreshold || 50000), // 可自定義精選閾值
    }
  })

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 根據檔案副檔名決定輸出格式
  if (outputFile.endsWith('.ts') || outputFile.endsWith('.tsx')) {
    // 輸出 TypeScript 格式 (向後相容)
    const tsContent = `import type { Video } from '@/lib/types/video'

export const videoList: Video[] = ${JSON.stringify(convertedVideos, null, 2)}
`
    fs.writeFileSync(outputFile, tsContent)
  } else {
    // 默認輸出 JSON 格式
    fs.writeFileSync(outputFile, JSON.stringify(convertedVideos, null, 2))
  }

  // Generate statistics
  const categories = [...new Set(convertedVideos.map((v) => v.category))]
  const _categoryStats = categories.map(
    (cat) => `${cat}: ${convertedVideos.filter((v) => v.category === cat).length}`
  )

  return {
    totalVideos: convertedVideos.length,
    categories: categories,
    featuredCount: convertedVideos.filter((v) => v.featured).length,
    outputFile: outputFile,
  }
}

// Command line usage
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    process.exit(1)
  }

  const [inputFile, outputFile] = args
  let channelInfo = {}

  // Parse channel info if provided
  const channelIndex = args.indexOf('--channel')
  if (channelIndex !== -1 && channelIndex + 1 < args.length) {
    try {
      channelInfo = JSON.parse(args[channelIndex + 1])
    } catch (_error) {
      console.error('❌ 頻道資訊格式錯誤，使用預設值')
      channelInfo = {}
    }
  }

  try {
    const _result = convertYouTubeToVideoType(inputFile, outputFile, channelInfo)
  } catch (error) {
    console.error('❌ 轉換失敗:', error.message)
    process.exit(1)
  }
}

module.exports = { convertYouTubeToVideoType }
