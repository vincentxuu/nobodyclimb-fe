import { Hono } from 'hono';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const usersRoutes = new Hono<{ Bindings: Env }>();

// POST /users/upload-avatar - Upload avatar image to R2 storage
usersRoutes.post('/upload-avatar', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const formData = await c.req.formData();
  const file = formData.get('avatar') as File | null;

  if (!file) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'No avatar file provided',
      },
      400
    );
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      },
      400
    );
  }

  // Get current user to check for existing avatar
  const currentUser = await c.env.DB.prepare(
    'SELECT avatar_url FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ avatar_url: string | null }>();

  // Delete old avatar from R2 if it exists
  if (currentUser?.avatar_url) {
    try {
      const oldKey = new URL(currentUser.avatar_url).pathname.substring(1);
      await c.env.STORAGE.delete(oldKey);
    } catch (err) {
      console.error(`Failed to delete old avatar for user ${userId}: ${err}`);
    }
  }

  // Generate unique filename
const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ext = extMap[file.type as keyof typeof extMap];
  const filename = `avatars/${generateId()}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.STORAGE.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Construct URL using environment variable
  const url = `${c.env.R2_PUBLIC_URL}/${filename}`;

  // Update user's avatar_url in database
  await c.env.DB.prepare(
    "UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(url, userId)
    .run();

  return c.json({
    success: true,
    data: { url },
  });
});
