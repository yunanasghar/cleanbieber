import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/fonnte';
import { getSystemSettings, updateSystemSetting, addAuditLog, updateAdminPassword } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { action } = body;

    if (action === 'test-whatsapp') {
      const settings = await getSystemSettings();
      const targetPhone = body.targetPhone || settings.adminWhatsAppNumber;
      const testMsg = `🔔 *Tes Notifikasi CleanBieber*\n\nHalo, ${admin.name}!\nIntegrasi WhatsApp Fonnte untuk CleanBieber Kelas 10 SIJA B telah berhasil terhubung.\n\nWaktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

      const res = await sendWhatsAppMessage(targetPhone, testMsg);
      await addAuditLog('TEST_WHATSAPP', admin.id, `Tes pengiriman WhatsApp ke ${targetPhone}: ${res.status}`);

      return NextResponse.json(res);
    }

    if (action === 'update-settings') {
      const { adminWhatsAppNumber, adminWhatsAppNumbers, allowPublicSubmissions } = body;
      
      if (adminWhatsAppNumbers !== undefined) {
        const rawString = Array.isArray(adminWhatsAppNumbers)
          ? adminWhatsAppNumbers.join(', ')
          : String(adminWhatsAppNumbers);
        await updateSystemSetting('adminWhatsAppNumbers', rawString);
        // Also keep primary number
        const first = rawString.split(/[\n,;]+/)[0]?.trim();
        if (first) {
          await updateSystemSetting('adminWhatsAppNumber', first);
        }
      } else if (adminWhatsAppNumber) {
        await updateSystemSetting('adminWhatsAppNumber', adminWhatsAppNumber);
      }

      if (allowPublicSubmissions !== undefined) {
        await updateSystemSetting('allowPublicSubmissions', String(allowPublicSubmissions));
      }

      await addAuditLog('UPDATE_SETTINGS', admin.id, `Admin ${admin.name} memperbarui pengaturan sistem.`);
      return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan.' });
    }

    if (action === 'change-password') {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }
      const hashed = await hashPassword(newPassword);
      await updateAdminPassword(admin.id, hashed);
      await addAuditLog('CHANGE_PASSWORD', admin.id, `Admin ${admin.name} mengganti password.`);
      return NextResponse.json({ success: true, message: 'Password berhasil diperbarui.' });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Gagal memproses permintaan pengaturan.' }, { status: 500 });
  }
}
