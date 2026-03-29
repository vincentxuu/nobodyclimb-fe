#!/usr/bin/env tsx
/**
 * JSON → D1 遷移腳本 (岩館資料)
 * 將現有的 gyms.json 靜態資料遷移到 D1 資料庫
 *
 * Usage:
 *   pnpm migrate:json           # 執行遷移
 *   pnpm migrate:json --dry-run # 預覽模式
 */

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { config } from './config.js'
import type { GymJsonData, GymsJsonFile } from './types.js'
import { buildGymSQL, executeBatchD1Query } from './utils/d1.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ============================================
// Migration Logic
// ============================================

function loadGymsJson(): GymJsonData[] {
  const dataPath = join(__dirname, config.jsonDataPath, 'gyms.json')

  try {
    const content = readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(content) as GymsJsonFile

    if (!data.gyms || !Array.isArray(data.gyms)) {
      console.error('❌ Invalid gyms.json format: missing "gyms" array')
      process.exit(1)
    }

    return data.gyms
  } catch (error) {
    console.error(`❌ Failed to load gyms.json:`, error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function migrateToD1(gyms: GymJsonData[], dryRun: boolean): void {
  let _totalGyms = 0

  if (dryRun) {
    for (const _gym of gyms) {
    }

    return
  }

  // Build all SQL statements
  const sqlStatements: string[] = []
  for (const gym of gyms) {
    sqlStatements.push(buildGymSQL(gym))
  }

  // Execute batch
  const { success, failed } = executeBatchD1Query(sqlStatements, 20)
  _totalGyms = success

  if (failed > 0) {
  } else {
  }
}

// ============================================
// CLI Entry Point
// ============================================

function sleep(ms: number): void {
  const end = Date.now() + ms
  while (Date.now() < end) {
    // busy wait
  }
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  if (dryRun) {
  } else {
  }

  const gyms = loadGymsJson()

  if (gyms.length === 0) {
    process.exit(0)
  }

  for (const gym of gyms) {
    const _name = gym.name.padEnd(30).slice(0, 30)
    const _city = (gym.location.city || '-').padEnd(10).slice(0, 10)
    const _type = (gym.type || '-').padEnd(8).slice(0, 8)
  }

  // Count by region
  const regionCounts = gyms.reduce(
    (acc, gym) => {
      const region = gym.location.region || '其他'
      acc[region] = (acc[region] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  for (const [_region, _count] of Object.entries(regionCounts)) {
  }

  if (!dryRun) {
    sleep(3000)
  }

  migrateToD1(gyms, dryRun)
}

try {
  main()
} catch (error) {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
}
