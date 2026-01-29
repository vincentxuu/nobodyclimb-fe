import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { BiographyContentCrudRepository } from '../repositories/biography-content-crud-repository';
import { BiographyContentInteractionsService } from '../services/biography-content-interactions-service';

export const biographyContentRoutes = new Hono<{ Bindings: Bindings }>();

// ═══════════════════════════════════════════
// 輔助函數 - 初始化 Repository 和 Service
// ═══════════════════════════════════════════

function getRepositories(db: D1Database) {
  return {
    contentRepo: new BiographyContentCrudRepository(db),
    interactionsService: new BiographyContentInteractionsService(db),
  };
}

// ═══════════════════════════════════════════
// 選擇題 API
// ═══════════════════════════════════════════

// 取得選擇題（含選項統計）
biographyContentRoutes.get('/choice-questions', async (c) => {
  const db = c.env.DB;
  const stage = c.req.query('stage') || 'onboarding';

  // 使用 JOIN 一次取得所有問題和選項（避免 N+1 查詢）
  const result = await db
    .prepare(
      `SELECT
        cq.id as question_id,
        cq.question,
        cq.hint,
        cq.follow_up_prompt,
        cq.follow_up_placeholder,
        cq.display_order,
        co.id as option_id,
        co.label,
        co.value,
        co.is_other,
        co.response_template,
        co.sort_order,
        (SELECT COUNT(*) FROM choice_answers ca WHERE ca.option_id = co.id) as count
       FROM choice_questions cq
       LEFT JOIN choice_options co ON cq.id = co.question_id
       WHERE cq.is_active = 1 AND cq.stage = ?
       ORDER BY cq.display_order, co.sort_order`
    )
    .bind(stage)
    .all();

  // 將扁平化結果組合成巢狀結構
  const questionsMap = new Map<
    string,
    {
      id: string;
      question: string;
      hint: string | null;
      follow_up_prompt: string | null;
      follow_up_placeholder: string | null;
      options: Array<{
        id: string;
        label: string;
        value: string;
        is_other: boolean;
        response_template: string | null;
        count: number;
      }>;
    }
  >();

  for (const row of result.results || []) {
    const qId = row.question_id as string;

    if (!questionsMap.has(qId)) {
      questionsMap.set(qId, {
        id: qId,
        question: row.question as string,
        hint: row.hint as string | null,
        follow_up_prompt: row.follow_up_prompt as string | null,
        follow_up_placeholder: row.follow_up_placeholder as string | null,
        options: [],
      });
    }

    // 如果有選項資料，加入選項列表
    if (row.option_id) {
      questionsMap.get(qId)!.options.push({
        id: row.option_id as string,
        label: row.label as string,
        value: row.value as string,
        is_other: row.is_other === 1,
        response_template: row.response_template as string | null,
        count: (row.count as number) || 0,
      });
    }
  }

  const questionsWithOptions = Array.from(questionsMap.values());

  return c.json({
    success: true,
    data: questionsWithOptions,
  });
});

// 輸入驗證常數
const MAX_CUSTOM_TEXT_LENGTH = 200;
const MAX_FOLLOW_UP_TEXT_LENGTH = 500;

// 提交選擇題回答
biographyContentRoutes.post(
  '/biographies/:biographyId/choice-answers',
  authMiddleware,
  async (c) => {
    const biographyId = c.req.param('biographyId');
    const userId = c.get('userId');
    const { question_id, option_id, custom_text, follow_up_text } = await c.req.json();
    const db = c.env.DB;

    // 驗證輸入
    if (!question_id) {
      return c.json({ success: false, error: '問題 ID 為必填' }, 400);
    }

    // 驗證文字長度
    if (custom_text && typeof custom_text === 'string' && custom_text.length > MAX_CUSTOM_TEXT_LENGTH) {
      return c.json({ success: false, error: `自訂文字不可超過 ${MAX_CUSTOM_TEXT_LENGTH} 字` }, 400);
    }

    if (follow_up_text && typeof follow_up_text === 'string' && follow_up_text.length > MAX_FOLLOW_UP_TEXT_LENGTH) {
      return c.json({ success: false, error: `補充說明不可超過 ${MAX_FOLLOW_UP_TEXT_LENGTH} 字` }, 400);
    }

    // 驗證權限
    const biography = await db
      .prepare('SELECT user_id FROM biographies WHERE id = ?')
      .bind(biographyId)
      .first<{ user_id: string }>();

    if (!biography || biography.user_id !== userId) {
      return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
    }

    // 取得選項資訊（用於回傳個人化回應）
    let responseMessage = '感謝你的回答！';
    let communityCount = 0;

    if (option_id) {
      const option = await db
        .prepare(
          `SELECT response_template,
           (SELECT COUNT(*) FROM choice_answers WHERE option_id = ?) as count
           FROM choice_options WHERE id = ?`
        )
        .bind(option_id, option_id)
        .first<{ response_template: string; count: number }>();

      if (option) {
        responseMessage = option.response_template || responseMessage;
        communityCount = option.count || 0;
      }
    }

    // 儲存或更新回答（使用 UPSERT）
    const answerId = `ca_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await db
      .prepare(
        `INSERT INTO choice_answers (id, biography_id, question_id, option_id, custom_text, follow_up_text)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (biography_id, question_id)
         DO UPDATE SET
           option_id = excluded.option_id,
           custom_text = excluded.custom_text,
           follow_up_text = excluded.follow_up_text,
           updated_at = datetime('now')`
      )
      .bind(answerId, biographyId, question_id, option_id || null, custom_text || null, follow_up_text || null)
      .run();

    return c.json({
      success: true,
      data: {
        response_message: responseMessage,
        community_count: communityCount + 1, // 加 1 包含自己
      },
    });
  }
);

// 取得用戶的選擇題回答
biographyContentRoutes.get(
  '/biographies/:biographyId/choice-answers',
  optionalAuthMiddleware,
  async (c) => {
    const biographyId = c.req.param('biographyId');
    const db = c.env.DB;

    const answers = await db
      .prepare(
        `SELECT ca.question_id, ca.option_id, ca.custom_text, ca.follow_up_text,
                co.label as option_label, co.value as option_value
         FROM choice_answers ca
         LEFT JOIN choice_options co ON ca.option_id = co.id
         WHERE ca.biography_id = ?`
      )
      .bind(biographyId)
      .all();

    return c.json({
      success: true,
      data: answers.results || [],
    });
  }
);

// ═══════════════════════════════════════════
// 公開 API：取得題目列表
// ═══════════════════════════════════════════

biographyContentRoutes.get('/questions', async (c) => {
  const { contentRepo } = getRepositories(c.env.DB);

  const questions = await contentRepo.getAllQuestions();

  return c.json({
    success: true,
    data: {
      core_stories: questions.coreQuestions,
      one_liners: questions.oneLinerQuestions,
      story_categories: questions.storyCategories,
      stories: questions.storyQuestions,
    },
  });
});

// ═══════════════════════════════════════════
// 核心故事 CRUD
// ═══════════════════════════════════════════

biographyContentRoutes.get(
  '/biographies/:biographyId/core-stories',
  optionalAuthMiddleware,
  async (c) => {
    const biographyId = c.req.param('biographyId');
    const userId = c.get('userId');
    const { contentRepo, interactionsService } = getRepositories(c.env.DB);

    // 取得核心故事列表
    let stories = await contentRepo.getCoreStories(biographyId);

    // 如果使用者已登入，加入按讚狀態
    if (userId && stories.length > 0) {
      stories = await interactionsService.addLikeStatusToContents('core_story', stories, userId);
    }

    return c.json({ success: true, data: stories });
  }
);

biographyContentRoutes.post(
  '/biographies/:biographyId/core-stories',
  authMiddleware,
  async (c) => {
    const biographyId = c.req.param('biographyId');
    const userId = c.get('userId');
    const { question_id, content } = await c.req.json();
    const { contentRepo } = getRepositories(c.env.DB);

    // 驗證輸入
    if (!question_id || !content) {
      return c.json({ success: false, error: '問題 ID 和內容為必填' }, 400);
    }

    // 驗證權限
    const ownerId = await contentRepo.getBiographyOwnerId(biographyId);
    if (!ownerId || ownerId !== userId) {
      return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
    }

    // 儲存核心故事
    await contentRepo.upsertCoreStory(biographyId, question_id, content);

    return c.json({ success: true, message: '核心故事已儲存' });
  }
);

biographyContentRoutes.post('/core-stories/:id/like', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    const result = await interactionsService.toggleLike('core_story', storyId, userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 404);
  }
});

biographyContentRoutes.get('/core-stories/:id/comments', async (c) => {
  const storyId = c.req.param('id');
  const { interactionsService } = getRepositories(c.env.DB);

  const comments = await interactionsService.getComments('core_story', storyId);
  return c.json({ success: true, data: comments });
});

biographyContentRoutes.post('/core-stories/:id/comments', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const { content, parent_id } = await c.req.json();
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    const newComment = await interactionsService.addComment(
      'core_story',
      storyId,
      userId,
      content,
      parent_id
    );
    return c.json({ success: true, data: newComment });
  } catch (error) {
    const statusCode = (error as Error).message.includes('找不到') ? 404 : 400;
    return c.json({ success: false, error: (error as Error).message }, statusCode);
  }
});

biographyContentRoutes.delete('/core-story-comments/:id', authMiddleware, async (c) => {
  const commentId = c.req.param('id');
  const userId = c.get('userId');
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    await interactionsService.deleteComment('core_story', commentId, userId);
    return c.json({ success: true, message: '留言已刪除' });
  } catch (error) {
    const statusCode = (error as Error).message.includes('找不到') ? 404 : 403;
    return c.json({ success: false, error: (error as Error).message }, statusCode);
  }
});

// ═══════════════════════════════════════════
// 一句話系列 CRUD
// ═══════════════════════════════════════════

biographyContentRoutes.get(
  '/biographies/:biographyId/one-liners',
  optionalAuthMiddleware,
  async (c) => {
    const biographyId = c.req.param('biographyId');
    const userId = c.get('userId');
    const { contentRepo, interactionsService } = getRepositories(c.env.DB);

    let oneLiners = await contentRepo.getOneLiners(biographyId);

    if (userId && oneLiners.length > 0) {
      oneLiners = await interactionsService.addLikeStatusToContents(
        'one_liner',
        oneLiners,
        userId
      );
    }

    return c.json({ success: true, data: oneLiners });
  }
);

biographyContentRoutes.post(
  '/biographies/:biographyId/one-liners',
  authMiddleware,
  async (c) => {
    const biographyId = c.req.param('biographyId');
    const userId = c.get('userId');
    const { question_id, answer, question_text, source } = await c.req.json();
    const { contentRepo } = getRepositories(c.env.DB);

    if (!question_id || !answer) {
      return c.json({ success: false, error: '問題 ID 和回答為必填' }, 400);
    }

    const ownerId = await contentRepo.getBiographyOwnerId(biographyId);
    if (!ownerId || ownerId !== userId) {
      return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
    }

    await contentRepo.upsertOneLiner(biographyId, question_id, answer, question_text, source || 'system');

    return c.json({ success: true, message: '一句話已儲存' });
  }
);

biographyContentRoutes.delete('/one-liners/:id', authMiddleware, async (c) => {
  const oneLinerId = c.req.param('id');
  const userId = c.get('userId');
  const { contentRepo } = getRepositories(c.env.DB);

  const oneLiner = await contentRepo.getOneLinerWithOwner(oneLinerId);
  if (!oneLiner) {
    return c.json({ success: false, error: '找不到此一句話' }, 404);
  }

  if (oneLiner.owner_id !== userId) {
    return c.json({ success: false, error: '無權限刪除' }, 403);
  }

  await contentRepo.deleteOneLiner(oneLinerId);
  return c.json({ success: true, message: '已刪除' });
});

biographyContentRoutes.post('/one-liners/:id/like', authMiddleware, async (c) => {
  const oneLinerId = c.req.param('id');
  const userId = c.get('userId');
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    const result = await interactionsService.toggleLike('one_liner', oneLinerId, userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 404);
  }
});

biographyContentRoutes.get('/one-liners/:id/comments', async (c) => {
  const oneLinerId = c.req.param('id');
  const { interactionsService } = getRepositories(c.env.DB);

  const comments = await interactionsService.getComments('one_liner', oneLinerId);
  return c.json({ success: true, data: comments });
});

biographyContentRoutes.post('/one-liners/:id/comments', authMiddleware, async (c) => {
  const oneLinerId = c.req.param('id');
  const userId = c.get('userId');
  const { content, parent_id } = await c.req.json();
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    const newComment = await interactionsService.addComment(
      'one_liner',
      oneLinerId,
      userId,
      content,
      parent_id
    );
    return c.json({ success: true, data: newComment });
  } catch (error) {
    const statusCode = (error as Error).message.includes('找不到') ? 404 : 400;
    return c.json({ success: false, error: (error as Error).message }, statusCode);
  }
});

// ═══════════════════════════════════════════
// 小故事 CRUD
// ═══════════════════════════════════════════

biographyContentRoutes.get('/biographies/:biographyId/stories', optionalAuthMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');
  const categoryId = c.req.query('category_id');
  const { contentRepo, interactionsService } = getRepositories(c.env.DB);

  let stories = await contentRepo.getStories(biographyId, categoryId);

  if (userId && stories.length > 0) {
    stories = await interactionsService.addLikeStatusToContents('story', stories, userId);
  }

  return c.json({ success: true, data: stories });
});

biographyContentRoutes.post('/biographies/:biographyId/stories', authMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');
  const { question_id, content, category_id, question_text, source } = await c.req.json();
  const { contentRepo } = getRepositories(c.env.DB);

  if (!question_id || !content) {
    return c.json({ success: false, error: '問題 ID 和內容為必填' }, 400);
  }

  const ownerId = await contentRepo.getBiographyOwnerId(biographyId);
  if (!ownerId || ownerId !== userId) {
    return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
  }

  await contentRepo.upsertStory(
    biographyId,
    question_id,
    content,
    category_id,
    question_text,
    source || 'system'
  );

  return c.json({ success: true, message: '故事已儲存' });
});

biographyContentRoutes.delete('/stories/:id', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const { contentRepo } = getRepositories(c.env.DB);

  const story = await contentRepo.getStoryWithOwner(storyId);
  if (!story) {
    return c.json({ success: false, error: '找不到此故事' }, 404);
  }

  if (story.owner_id !== userId) {
    return c.json({ success: false, error: '無權限刪除' }, 403);
  }

  await contentRepo.deleteStory(storyId);
  return c.json({ success: true, message: '已刪除' });
});

biographyContentRoutes.post('/stories/:id/like', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    const result = await interactionsService.toggleLike('story', storyId, userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 404);
  }
});

biographyContentRoutes.get('/stories/:id/comments', async (c) => {
  const storyId = c.req.param('id');
  const { interactionsService } = getRepositories(c.env.DB);

  const comments = await interactionsService.getComments('story', storyId);
  return c.json({ success: true, data: comments });
});

biographyContentRoutes.post('/stories/:id/comments', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const { content, parent_id } = await c.req.json();
  const { interactionsService } = getRepositories(c.env.DB);

  try {
    const newComment = await interactionsService.addComment(
      'story',
      storyId,
      userId,
      content,
      parent_id
    );
    return c.json({ success: true, data: newComment });
  } catch (error) {
    const statusCode = (error as Error).message.includes('找不到') ? 404 : 400;
    return c.json({ success: false, error: (error as Error).message }, statusCode);
  }
});

// ═══════════════════════════════════════════
// 探索/熱門
// ═══════════════════════════════════════════

biographyContentRoutes.get('/popular/core-stories', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  const { contentRepo } = getRepositories(c.env.DB);

  const stories = await contentRepo.getPopularCoreStories(limit);
  return c.json({ success: true, data: stories });
});

biographyContentRoutes.get('/popular/one-liners', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  const { contentRepo } = getRepositories(c.env.DB);

  const oneLiners = await contentRepo.getPopularOneLiners(limit);
  return c.json({ success: true, data: oneLiners });
});

biographyContentRoutes.get('/popular/stories', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  const categoryId = c.req.query('category_id');
  const { contentRepo } = getRepositories(c.env.DB);

  const stories = await contentRepo.getPopularStories(limit, categoryId);
  return c.json({ success: true, data: stories });
});

// ═══════════════════════════════════════════
// 快速反應 API
// ═══════════════════════════════════════════

const VALID_REACTION_TYPES = ['me_too', 'plus_one', 'well_said'] as const;
type ReactionType = (typeof VALID_REACTION_TYPES)[number];

function isValidReactionType(type: string): type is ReactionType {
  return VALID_REACTION_TYPES.includes(type as ReactionType);
}

const VALID_CONTENT_TYPES = ['core-stories', 'one-liners', 'stories'] as const;
type ContentTypeParam = (typeof VALID_CONTENT_TYPES)[number];

const CONTENT_TYPE_MAP: Record<ContentTypeParam, 'core_story' | 'one_liner' | 'story'> = {
  'core-stories': 'core_story',
  'one-liners': 'one_liner',
  'stories': 'story',
};

function isValidContentType(type: string): type is ContentTypeParam {
  return VALID_CONTENT_TYPES.includes(type as ContentTypeParam);
}

// 統一的快速反應路由
biographyContentRoutes.post('/:contentType/:id/reaction', authMiddleware, async (c) => {
  const contentTypeParam = c.req.param('contentType');
  const contentId = c.req.param('id');
  const userId = c.get('userId');
  const { reaction_type } = await c.req.json();
  const { interactionsService } = getRepositories(c.env.DB);

  if (!isValidContentType(contentTypeParam)) {
    return c.json({ success: false, error: '無效的內容類型' }, 400);
  }

  if (!reaction_type || !isValidReactionType(reaction_type)) {
    return c.json({ success: false, error: '無效的反應類型' }, 400);
  }

  try {
    const result = await interactionsService.toggleReaction(
      CONTENT_TYPE_MAP[contentTypeParam],
      contentId,
      reaction_type,
      userId
    );
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 404);
  }
});

// 取得內容的反應狀態（公開 API）
biographyContentRoutes.get('/:contentType/:id/reactions', optionalAuthMiddleware, async (c) => {
  const contentTypeParam = c.req.param('contentType');
  const contentId = c.req.param('id');
  const userId = c.get('userId');
  const { interactionsService } = getRepositories(c.env.DB);

  if (!isValidContentType(contentTypeParam)) {
    return c.json({ success: false, error: '無效的內容類型' }, 400);
  }

  const mappedContentType = CONTENT_TYPE_MAP[contentTypeParam];

  try {
    const counts = await interactionsService.getReactionCounts(mappedContentType, contentId);

    const userReactions = userId
      ? await interactionsService.getUserReactions(mappedContentType, contentId, userId)
      : [];

    return c.json({
      success: true,
      data: {
        counts,
        user_reactions: userReactions,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});
