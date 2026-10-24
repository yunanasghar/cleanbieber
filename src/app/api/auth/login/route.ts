import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminByUsername, addAuditLog } from '@/lib/db';
import {
  verifyPassword,
  createAdminSessionCookie,
  checkLoginRateLimit,
  clearLoginRateLimit,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

const LoginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    
    // Rate limit check
    const rateLimit = checkLoginRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const admin = await getAdminByUsername(username);

    // Generic error message to prevent username enumeration
    if (!admin) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    // Success: clear rate limit counter
    clearLoginRateLimit(ip);

    // Create session cookie
    const token = await createAdminSessionCookie(admin.id);

    try {
      await addAuditLog('LOGIN', admin.id, `Admin ${admin.name} berhasil login.`, ip);
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    const res = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan internal pada server',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
