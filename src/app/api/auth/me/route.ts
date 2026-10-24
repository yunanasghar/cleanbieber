import { NextResponse, connection } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  await connection();
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ authenticated: false, admin: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, admin });
}
