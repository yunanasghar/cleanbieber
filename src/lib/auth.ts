import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createSession, getSession, deleteSession } from './db.ts';
import type { AdminUser } from './types.ts';

const SESSION_COOKIE_NAME = 'cleanbieber_admin_session';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

async function getCookieStore() {
  const nextHeaders = await import('next/headers');
  return nextHeaders.cookies();
}

// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 mins window
    return { allowed: true, remainingAttempts: 4 };
  }

  if (entry.count >= 5) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remainingAttempts: 5 - entry.count };
}

export function clearLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createAdminSessionCookie(adminId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await createSession(adminId, token, expiresAt);

  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return token;
}

export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await getCookieStore();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await getSession(token);
  } catch {
    return null;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    const cookieStore = await getCookieStore();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await deleteSession(token);
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch {
    // Ignore cookie clearing errors
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    throw new Error('UNAUTHORIZED');
  }
  return admin;
}
