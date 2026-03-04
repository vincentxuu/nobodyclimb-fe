import { D1Database } from '@cloudflare/workers-types';
import { generateId } from '../utils/id';

export interface UserMemory {
  id: string;
  user_id: string;
  memory_key: string;
  memory_type: 'preference' | 'behavior' | 'fact';
  content: string;
  updated_at: string;
}

// Task 2.1: 取得用戶所有記憶，依 updated_at 倒序
export async function getUserMemories(userId: string, db: D1Database): Promise<UserMemory[]> {
  const result = await db
    .prepare(
      `SELECT id, user_id, memory_key, memory_type, content, updated_at
       FROM user_ai_memory
       WHERE user_id = ?
       ORDER BY updated_at DESC`
    )
    .bind(userId)
    .all<UserMemory>();
  return result.results;
}

// Task 2.2: 以 (user_id, memory_key) UPSERT，更新 content 與 updated_at
export async function upsertMemory(
  userId: string,
  memoryKey: string,
  memoryType: 'preference' | 'behavior' | 'fact',
  content: string,
  db: D1Database
): Promise<void> {
  const id = generateId();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO user_ai_memory (id, user_id, memory_key, memory_type, content, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, memory_key) DO UPDATE SET
         memory_type = excluded.memory_type,
         content = excluded.content,
         updated_at = excluded.updated_at`
    )
    .bind(id, userId, memoryKey, memoryType, content, now)
    .run();
}

// Task 2.3: 刪除屬於 userId 的記憶；不存在或不屬於該用戶時靜默處理
export async function deleteMemory(
  userId: string,
  memoryId: string,
  db: D1Database
): Promise<boolean> {
  const result = await db
    .prepare(`DELETE FROM user_ai_memory WHERE id = ? AND user_id = ?`)
    .bind(memoryId, userId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

// Task 2.4: 返回格式化字串供注入 system prompt；無記憶時返回 null
export async function getMemoriesSummary(userId: string, db: D1Database): Promise<string | null> {
  const memories = await getUserMemories(userId, db);
  if (memories.length === 0) return null;

  const lines = memories.map((m) => `${m.memory_key}：${m.content}`);
  return lines.join('\n');
}
