import crypto from 'node:crypto';
import { NextRequest, NextResponse, connection } from 'next/server';
import {
  getStudents,
  getAttendanceLogs,
  getSystemSettings,
  hasNotificationBeenSent,
  recordNotificationLog,
} from '@/lib/db';
import { getISOWeekInfo, getWeekDateRange } from '@/lib/rotation';
import { generateWeeklyExcelReport } from '@/lib/excel';
import { sendWhatsAppToMultiple } from '@/lib/fonnte';

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(cronSecret);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  await connection();
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Cron Secret' }, { status: 401 });
  }

  try {
    const settings = await getSystemSettings();
    const adminPhones = settings.adminWhatsAppNumbers;

    const { isoWeek, isoYear, dateString } = getISOWeekInfo();
    const { startDate, endDate, label } = getWeekDateRange(isoWeek, isoYear);

    // Duplicate check for primary admin
    const primaryAdmin = adminPhones[0] || '089673038689';
    const alreadySent = await hasNotificationBeenSent('WEEKLY_RECAP', dateString, primaryAdmin);
    if (alreadySent) {
      return NextResponse.json({
        skipped: true,
        message: `Rekap mingguan untuk tanggal ${dateString} sudah pernah dikirimkan sebelumnya.`,
      });
    }

    const [students, logs] = await Promise.all([
      getStudents(),
      getAttendanceLogs({ startDate, endDate }),
    ]);

    const totalSubmissions = logs.length;
    const verifiedCount = logs.filter((l) => l.status === 'verified').length;
    const rejectedCount = logs.filter((l) => l.status === 'rejected').length;
    const pendingCount = logs.filter((l) => l.status === 'pending').length;

    // Task breakdown
    const mbgLogs = logs.filter((l) => l.taskName === 'MBG');
    const mbgVerified = mbgLogs.filter((l) => l.status === 'verified').length;

    const nyapuLogs = logs.filter((l) => l.taskName === 'Nyapu & Pel');
    const nyapuVerified = nyapuLogs.filter((l) => l.status === 'verified').length;

    const helperLogs = logs.filter((l) => l.taskName === 'Helper');
    const helperVerified = helperLogs.filter((l) => l.status === 'verified').length;

    const percent = students.length ? Math.round((verifiedCount / students.length) * 100) : 0;

    // Generate Excel attachment
    const excelBuffer = await generateWeeklyExcelReport({
      weekLabel: label,
      startDate,
      endDate,
      students,
      attendanceLogs: logs,
    });

    const filename = `Rekap_Piket_10SIJAB_W${isoWeek}_${isoYear}.xlsx`;
    const appUrl = process.env.APP_URL || 'https://cleanbieber.vercel.app';

    const message = `📊 *REKAPITULASI MINGGUAN PIKET — ${settings.classLabel.toUpperCase()}*
📅 *Periode:* ${label} (${startDate} s.d. ${endDate})
━━━━━━━━━━━━━━━━━━━━━

📈 *RINGKASAN KEHADIRAN KELAS (Total 36 Siswa):*
• ✅ Hadir & Terverifikasi: *${verifiedCount} Siswa* (${percent}%)
• ⏳ Menunggu Verifikasi: ${pendingCount} Siswa
• ❌ Tidak Hadir / Ditolak: ${rejectedCount} Siswa

📋 *Rincian Kehadiran per Tugas:*
• 🍱 MBG (Makanan Bergizi): ${mbgVerified}/${mbgLogs.length} selesai
• 🧹 Nyapu & Pel Kelas: ${nyapuVerified}/${nyapuLogs.length} selesai
• 🤝 Helper (Koordinator): ${helperVerified}/${helperLogs.length} selesai

📎 *Lampiran Dokumen:*
File rekapitulasi resmi Microsoft Excel (.xlsx) terlampir langsung pada pesan ini.

🔗 Dashboard Admin: ${appUrl}/admin/rekap

_Pesan otomatis dikirim setiap Jumat malam pukul 20:00 WIB ke seluruh admin & pengurus kelas._`;

    // Send to all admin phone numbers with Excel attachment!
    const sendResult = await sendWhatsAppToMultiple(adminPhones, message, excelBuffer, filename);

    for (const phone of adminPhones) {
      await recordNotificationLog(
        'WEEKLY_RECAP',
        dateString,
        phone,
        sendResult.sent > 0 ? 'SUCCESS' : 'FAILED'
      );
    }

    return NextResponse.json({
      success: sendResult.sent > 0,
      weekLabel: label,
      recipients: adminPhones,
      sendResult,
      message,
    });
  } catch (error) {
    console.error('Error in weekly recap cron:', error);
    return NextResponse.json({ error: 'Internal server error in weekly recap cron' }, { status: 500 });
  }
}
