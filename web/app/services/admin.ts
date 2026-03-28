import { get, post, put, del } from './utils';
import type { UserInfo } from './auth';

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  role?: string;
  active?: boolean;
}

export interface AccessToken {
  token: string;
  userId: number;
  createdBy: number;
  label: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface CreateTokenPayload {
  label?: string;
  expiresIn?: string;
}

export const adminCreateUser = (payload: CreateUserPayload): Promise<UserInfo> =>
  post<UserInfo>('/api/admin/users', payload);

export const adminListUsers = (page = 1, pageSize = 50): Promise<{ users: UserInfo[]; total: number }> =>
  get('/api/admin/users', { params: { page, pageSize } });

export const adminUpdateUser = (id: number, payload: UpdateUserPayload): Promise<UserInfo> =>
  put<UserInfo>(`/api/admin/users/${id}`, payload);

export const adminCreateToken = (userId: number, payload: CreateTokenPayload): Promise<AccessToken> =>
  post<AccessToken>(`/api/admin/users/${userId}/tokens`, payload);

export const adminListTokens = (userId: number): Promise<{ tokens: AccessToken[] }> =>
  get(`/api/admin/users/${userId}/tokens`);

export const adminRevokeToken = (token: string): Promise<void> =>
  del(`/api/admin/tokens/${token}`);
