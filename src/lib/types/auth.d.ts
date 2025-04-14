import { User } from '@/lib/types';

// 自定義認證類型定義

export interface AuthSession {
  user: User;
  expires: string;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}
