// 修復 biography_core_stories 缺失的資料
// 針對 json_valid() = 0 的 biography（one_liners_data 有非法 JSON 字元）
// 這些資料的 climbing_origin/meaning/advice_to_self 在 invalid JSON 之前，可用 regex 提取

const PREVIEW_API = 'https://api-preview.nobodyclimb.cc/api/v1'
const _PROD_API = 'https://api.nobodyclimb.cc/api/v1'

const biographyIds = [
  '143659e3379afb60d0b546876ed4a9f0',
  '07860cffd0157e5d160a64d91487306b',
  'dd5d2e4c3d20b374dc1f71dc7ac6fd0f',
  '94560b74e0b48840fecafd8a30a23132',
  '4ce6e0274155ec033649584ff6c69ce8',
  'f1d1d223e462de5b61eb26b286e8f9c2',
]

// 用 regex 提取指定欄位的 answer（處理帶跳脫字元的字串）
function extractField(raw, fieldName) {
  // 匹配 "fieldName":{"answer":"<value>","
  // <value> 可能含有 \" 跳脫字元，但在我們需要的欄位中這幾個都是乾淨的
  const startMarker = `"${fieldName}":{"answer":"`
  const startIdx = raw.indexOf(startMarker)
  if (startIdx === -1) return null

  const valueStart = startIdx + startMarker.length
  // 找到結束的 " (非跳脫的)
  let i = valueStart
  while (i < raw.length) {
    if (raw[i] === '"' && raw[i - 1] !== '\\') break
    if (raw[i] === '\\') i++ // 跳過跳脫字元
    i++
  }

  const value = raw.substring(valueStart, i)
  // 還原跳脫字元
  return value
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
}

async function fetchBio(apiBase, id) {
  const res = await fetch(`${apiBase}/biographies/${id}`)
  const json = await res.json()
  return json.data
}

async function main() {
  const coreFields = ['climbing_origin', 'climbing_meaning', 'advice_to_self']

  const results = []

  for (const id of biographyIds) {
    const bio = await fetchBio(PREVIEW_API, id)
    if (!bio) {
      continue
    }

    const raw = bio.one_liners_data
    let isValidJson = false
    try {
      JSON.parse(raw)
      isValidJson = true
    } catch (_e) {}

    const extracted = {}
    for (const field of coreFields) {
      // 先試 JSON.parse
      if (isValidJson) {
        const parsed = JSON.parse(raw)
        extracted[field] = parsed[field]?.answer || null
      } else {
        extracted[field] = extractField(raw, field)
      }
    }

    results.push({ id, slug: bio.slug, extracted })
  }

  for (const { id, slug, extracted } of results) {
    let hasData = false
    for (const [_field, value] of Object.entries(extracted)) {
      if (value && value.trim()) {
        hasData = true
        // 跳脫單引號
        const _escapedValue = value.replace(/'/g, "''")
      }
    }
    if (!hasData)
  }
}

main().catch(console.error)
