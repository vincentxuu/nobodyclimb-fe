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
