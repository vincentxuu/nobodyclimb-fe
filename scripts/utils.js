/**
 * 共用工具函式
 */

/**
 * 正規化頻道名稱（處理合作影片）
 * 例如 "Adam Ondra and MAMMUT" -> "Adam Ondra"
 * @param {string} channelName - 頻道名稱
 * @returns {string} 正規化後的頻道名稱
 */
function normalizeChannelName(channelName) {
  if (!channelName) return channelName;

  // 處理 " and X more" 格式 (例如 "Five Ten and 2 more")
  const andMoreMatch = channelName.match(/^(.+?) and \d+ more$/);
  if (andMoreMatch) {
    return andMoreMatch[1].trim();
  }

  // 處理 " and OtherChannel" 格式 (例如 "Adam Ondra and MAMMUT")
  const andMatch = channelName.match(/^(.+?) and .+$/);
  if (andMatch) {
    return andMatch[1].trim();
  }

  return channelName;
}

module.exports = {
  normalizeChannelName
};
