import { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import { Env, JwtPayload } from '../types';

// Get JWT secret
function getJwtSecret(env: Env): Uint8Array {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return new TextEncoder().encode(env.JWT_SECRET);
}

// Extend Hono context with user info
declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
    userId: string;
  }
}

// JWT verification middleware
export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        },
        401
      );
    }

    const token = authHeader.substring(7);

    try {
      const secret = getJwtSecret(c.env);
      const { payload } = await jose.jwtVerify(token, secret, {
        issuer: c.env.JWT_ISSUER,
      });

      const user = payload as unknown as JwtPayload;
      c.set('user', user);
      c.set('userId', user.sub);

      await next();
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return c.json(
          {
            success: false,
            error: 'Token Expired',
            message: 'Access token has expired',
          },
          401
        );
      }

      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token',
        },
        401
      );
    }
  }
);

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret, {
          issuer: c.env.JWT_ISSUER,
        });

        const user = payload as unknown as JwtPayload;
        c.set('user', user);
        c.set('userId', user.sub);
      } catch {
        // Ignore token errors in optional auth
      }
    }

    await next();
  }
);

// Admin-only middleware
export const adminMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const user = c.get('user');

    if (!user || user.role !== 'admin') {
      return c.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
        },
        403
      );
    }

    await next();
  }
);

// JWT token generation utilities
export async function generateAccessToken(
  env: Env,
  payload: { sub: string; email: string; role: string }
): Promise<string> {
  const secret = getJwtSecret(env);

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function generateRefreshToken(
  env: Env,
  payload: { sub: string }
): Promise<string> {
  const secret = getJwtSecret(env);

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
