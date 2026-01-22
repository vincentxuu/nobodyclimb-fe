/**
 * Migration Script: Migrate one_liners_data and stories_data JSON to separate tables
 *
 * Run this script AFTER 0029_create_biography_content_tables.sql
 * and BEFORE 0032_cleanup_biography_redundant_columns.sql
 *
 * Usage:
 *   npx wrangler d1 execute nobodyclimb-db --local --file=scripts/migrate-json-stories.sql
 *   # or for remote:
 *   npx tsx scripts/migrate-json-stories.ts
 */

import { D1Database } from '@cloudflare/workers-types';

// Core story fields that go to biography_core_stories table
const CORE_STORY_FIELDS = ['climbing_origin', 'climbing_meaning', 'advice_to_self'];

// Generate UUID v4-like ID
function generateId(): string {
  const hex = () => Math.random().toString(16).substring(2, 10);
  return `${hex()}${hex()}-${hex().substring(0, 4)}-4${hex().substring(1, 4)}-${['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)]}${hex().substring(1, 4)}-${hex()}${hex().substring(0, 4)}`;
}

interface Biography {
  id: string;
  one_liners_data: string | null;
  stories_data: string | null;
  created_at: string;
  updated_at: string;
}

interface OneLinerItem {
  answer?: string;
  visibility?: string;
}

interface StoryItem {
  answer?: string;
  visibility?: string;
}

export async function migrateJsonStories(db: D1Database): Promise<void> {
  console.log('Starting JSON stories migration...');

  // Get all biographies with JSON data
  const biographies = await db.prepare(`
    SELECT id, one_liners_data, stories_data, created_at, updated_at
    FROM biographies
    WHERE one_liners_data IS NOT NULL OR stories_data IS NOT NULL
  `).all<Biography>();

  console.log(`Found ${biographies.results?.length || 0} biographies with JSON data`);

  let coreStoriesInserted = 0;
  let oneLinersInserted = 0;
  let storiesInserted = 0;

  for (const bio of biographies.results || []) {
    const now = new Date().toISOString();

    // Migrate one_liners_data
    if (bio.one_liners_data) {
      try {
        const oneLinersData = JSON.parse(bio.one_liners_data) as Record<string, OneLinerItem>;

        for (const [questionId, data] of Object.entries(oneLinersData)) {
          const answer = data?.answer;
          if (!answer || answer.trim() === '') continue;

          // Check if core story field
          if (CORE_STORY_FIELDS.includes(questionId)) {
            // Check if already exists
            const existing = await db.prepare(
              'SELECT id FROM biography_core_stories WHERE biography_id = ? AND question_id = ?'
            ).bind(bio.id, questionId).first();

            if (!existing) {
              const storyId = generateId();
              await db.prepare(`
                INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
              `).bind(storyId, bio.id, questionId, answer.trim(), bio.created_at || now, bio.updated_at || now).run();
              coreStoriesInserted++;
            }
          } else {
            // Regular one-liner
            const existing = await db.prepare(
              'SELECT id FROM biography_one_liners WHERE biography_id = ? AND question_id = ?'
            ).bind(bio.id, questionId).first();

            if (!existing) {
              const oneLinerId = generateId();
              await db.prepare(`
                INSERT INTO biography_one_liners (id, biography_id, question_id, answer, source, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'system', ?, ?)
              `).bind(oneLinerId, bio.id, questionId, answer.trim(), bio.created_at || now, bio.updated_at || now).run();
              oneLinersInserted++;
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing one_liners_data for biography ${bio.id}:`, e);
      }
    }

    // Migrate stories_data
    if (bio.stories_data) {
      try {
        const storiesData = JSON.parse(bio.stories_data) as Record<string, Record<string, StoryItem>>;

        for (const [categoryId, questions] of Object.entries(storiesData)) {
          if (!questions || typeof questions !== 'object') continue;

          for (const [questionId, data] of Object.entries(questions)) {
            const content = data?.answer;
            if (!content || content.trim() === '') continue;

            // Check if already exists
            const existing = await db.prepare(
              'SELECT id FROM biography_stories WHERE biography_id = ? AND question_id = ?'
            ).bind(bio.id, questionId).first();

            if (!existing) {
              const storyId = generateId();
              const wordCount = content.trim().length;
              const actualCategoryId = categoryId === 'uncategorized' ? null : categoryId;

              await db.prepare(`
                INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, source, word_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'system', ?, ?, ?)
              `).bind(storyId, bio.id, questionId, actualCategoryId, content.trim(), wordCount, bio.created_at || now, bio.updated_at || now).run();
              storiesInserted++;
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing stories_data for biography ${bio.id}:`, e);
      }
    }
  }

  console.log('Migration completed:');
  console.log(`  - Core stories inserted: ${coreStoriesInserted}`);
  console.log(`  - One-liners inserted: ${oneLinersInserted}`);
  console.log(`  - Stories inserted: ${storiesInserted}`);
}

// For running directly with wrangler
export default {
  async fetch(request: Request, env: { DB: D1Database }): Promise<Response> {
    try {
      await migrateJsonStories(env.DB);
      return new Response('Migration completed successfully', { status: 200 });
    } catch (error) {
      console.error('Migration failed:', error);
      return new Response(`Migration failed: ${error}`, { status: 500 });
    }
  },
};
