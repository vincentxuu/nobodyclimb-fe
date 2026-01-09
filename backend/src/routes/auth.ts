import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as jose from 'jose';
import { Env, User, GoogleTokenPayload } from '../types';
import { generateId } from '../utils/id';
import {
  authMiddleware,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
} from '../middleware/auth';

export const authRoutes = new Hono<{ Bindings: Env }>();

// User fields to select (reusable constant for maintainability)
const USER_SELECT_FIELDS = 'id, email, username, display_name, avatar_url, bio, climbing_start_year, frequent_gym, favorite_route_type, role, google_id, auth_provider, created_at';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  display_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /auth/register
authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, username, password, display_name } = c.req.valid('json');

  // Check if email or username already exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  )
    .bind(email, username)
    .first();

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Email or username already exists',
      },
      409
    );
  }

  const id = generateId();
  const password_hash = await hashPassword(password);

  await c.env.DB.prepare(
    `INSERT INTO users (id, email, username, password_hash, display_name)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, email, username, password_hash, display_name || null)
    .run();

  const access_token = await generateAccessToken(c.env, {
    sub: id,
    email,
    role: 'user',
  });
  const refresh_token = await generateRefreshToken(c.env, { sub: id });

  // Store refresh token hash
  const refresh_token_hash = await hashPassword(refresh_token);
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await c.env.DB.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(generateId(), id, refresh_token_hash, expires_at)
    .run();

  return c.json({
    success: true,
    data: {
      access_token,
      refresh_token,
      expires_in: 900, // 15 minutes
    },
  });
});

// POST /auth/login
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND is_active = 1'
  )
    .bind(email)
    .first<User>();

  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      },
      401
    );
  }

  // Check if user registered with Google (no password)
  if (!user.password_hash) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'This account uses Google login. Please sign in with Google.',
      },
      401
    );
  }

  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      },
      401
    );
  }

  const access_token = await generateAccessToken(c.env, {
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refresh_token = await generateRefreshToken(c.env, { sub: user.id });

  // Store refresh token hash
  const refresh_token_hash = await hashPassword(refresh_token);
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await c.env.DB.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(generateId(), user.id, refresh_token_hash, expires_at)
    .run();

  return c.json({
    success: true,
    data: {
      access_token,
      refresh_token,
      expires_in: 900,
    },
  });
});

// POST /auth/refresh-token
authRoutes.post('/refresh-token', async (c) => {
  const body = await c.req.json<{ refresh_token: string }>();
  const { refresh_token } = body;

  if (!refresh_token) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Refresh token is required',
      },
      400
    );
  }

  const token_hash = await hashPassword(refresh_token);

  const storedToken = await c.env.DB.prepare(
    `SELECT rt.*, u.email, u.role
     FROM refresh_tokens rt
     JOIN users u ON rt.user_id = u.id
     WHERE rt.token_hash = ? AND rt.expires_at > datetime('now')`
  )
    .bind(token_hash)
    .first<{ user_id: string; email: string; role: string }>();

  if (!storedToken) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      },
      401
    );
  }

  // Generate new tokens
  const access_token = await generateAccessToken(c.env, {
    sub: storedToken.user_id,
    email: storedToken.email,
    role: storedToken.role,
  });

  return c.json({
    success: true,
    data: {
      access_token,
      expires_in: 900,
    },
  });
});

// GET /auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const user = await c.env.DB.prepare(
    `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = ?`
  )
    .bind(userId)
    .first();

  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'User not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: user,
  });
});

// PUT /auth/profile
authRoutes.put('/profile', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    climbing_start_year?: string;
    frequent_gym?: string;
    favorite_route_type?: string;
  }>();

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (body.display_name !== undefined) {
    updates.push('display_name = ?');
    values.push(body.display_name);
  }
  if (body.bio !== undefined) {
    updates.push('bio = ?');
    values.push(body.bio);
  }
  if (body.avatar_url !== undefined) {
    updates.push('avatar_url = ?');
    values.push(body.avatar_url);
  }
  if (body.climbing_start_year !== undefined) {
    updates.push('climbing_start_year = ?');
    values.push(body.climbing_start_year);
  }
  if (body.frequent_gym !== undefined) {
    updates.push('frequent_gym = ?');
    values.push(body.frequent_gym);
  }
  if (body.favorite_route_type !== undefined) {
    updates.push('favorite_route_type = ?');
    values.push(body.favorite_route_type);
  }

  if (updates.length === 0) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'No fields to update',
      },
      400
    );
  }

  updates.push("updated_at = datetime('now')");
  values.push(userId);

  await c.env.DB.prepare(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
  )
    .bind(...values)
    .run();

  const user = await c.env.DB.prepare(
    `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = ?`
  )
    .bind(userId)
    .first();

  return c.json({
    success: true,
    data: user,
  });
});

// POST /auth/logout
authRoutes.post('/logout', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // Delete all refresh tokens for this user
  await c.env.DB.prepare('DELETE FROM refresh_tokens WHERE user_id = ?')
    .bind(userId)
    .run();

  return c.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Google OAuth schema
const googleAuthSchema = z.object({
  credential: z.string().min(1),
});

// POST /auth/google
authRoutes.post('/google', zValidator('json', googleAuthSchema), async (c) => {
  const { credential } = c.req.valid('json');

  try {
    // Decode and verify the Google ID token
    // Google's public keys for JWT verification
    const GOOGLE_JWKS = jose.createRemoteJWKSet(
      new URL('https://www.googleapis.com/oauth2/v3/certs')
    );

    const { payload } = await jose.jwtVerify(credential, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: c.env.GOOGLE_CLIENT_ID,
    });

    const googlePayload = payload as unknown as GoogleTokenPayload;

    // Validate required fields
    if (!googlePayload.email || !googlePayload.sub) {
      return c.json(
        {
          success: false,
          error: 'Invalid Token',
          message: 'Google token is missing required fields',
        },
        400
      );
    }

    // Check if email is verified
    if (!googlePayload.email_verified) {
      return c.json(
        {
          success: false,
          error: 'Email Not Verified',
          message: 'Please verify your Google email first',
        },
        400
      );
    }

    // Look for existing user by google_id first
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ? AND is_active = 1'
    )
      .bind(googlePayload.sub)
      .first<User>();

    // If not found by google_id, check by email
    if (!user) {
      user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE email = ? AND is_active = 1'
      )
        .bind(googlePayload.email)
        .first<User>();

      if (user) {
        // User exists with this email but no google_id - link accounts
        await c.env.DB.prepare(
          `UPDATE users SET google_id = ?, auth_provider = 'google', email_verified = 1, updated_at = datetime('now') WHERE id = ?`
        )
          .bind(googlePayload.sub, user.id)
          .run();

        // Update avatar if not set
        if (!user.avatar_url && googlePayload.picture) {
          await c.env.DB.prepare(
            `UPDATE users SET avatar_url = ? WHERE id = ?`
          )
            .bind(googlePayload.picture, user.id)
            .run();
        }
      }
    }

    // If still no user, create a new one
    if (!user) {
      const id = generateId();
      // Generate a unique username from email or name
      const baseUsername = googlePayload.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      let username = baseUsername;
      let counter = 1;

      // Ensure username is unique
      while (true) {
        const existing = await c.env.DB.prepare(
          'SELECT id FROM users WHERE username = ?'
        )
          .bind(username)
          .first();

        if (!existing) break;
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      await c.env.DB.prepare(
        `INSERT INTO users (id, email, username, display_name, avatar_url, google_id, auth_provider, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 'google', 1)`
      )
        .bind(
          id,
          googlePayload.email,
          username,
          googlePayload.name || null,
          googlePayload.picture || null,
          googlePayload.sub
        )
        .run();

      user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(id)
        .first<User>();
    }

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Server Error',
          message: 'Failed to create or retrieve user',
        },
        500
      );
    }

    // Generate tokens
    const access_token = await generateAccessToken(c.env, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refresh_token = await generateRefreshToken(c.env, { sub: user.id });

    // Store refresh token hash
    const refresh_token_hash = await hashPassword(refresh_token);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await c.env.DB.prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`
    )
      .bind(generateId(), user.id, refresh_token_hash, expires_at)
      .run();

    return c.json({
      success: true,
      data: {
        access_token,
        refresh_token,
        expires_in: 900, // 15 minutes
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);

    // Handle specific JWT verification errors
    if (error instanceof jose.errors.JWTExpired) {
      return c.json(
        {
          success: false,
          error: 'Token Expired',
          message: 'Google token has expired, please try again',
        },
        401
      );
    }

    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      return c.json(
        {
          success: false,
          error: 'Invalid Token',
          message: 'Google token validation failed',
        },
        401
      );
    }

    return c.json(
      {
        success: false,
        error: 'Authentication Failed',
        message: 'Failed to authenticate with Google',
      },
      401
    );
  }
});
