import { NextResponse } from 'next/server';
import { logoutAdmin, getAuthenticatedAdmin } from '@/lib/auth';
import { addAuditLog } from '@/lib/db';

export async function POST() {
  const admin = await getAuthenticatedAdmin();
  if (admin) {
    await addAuditLog('LOGOUT', admin.id, `Admin ${admin.name} logout.`);
  }
  await logoutAdmin();
  return NextResponse.json({ success: true });
}
