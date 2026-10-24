import crypto from 'node:crypto';
import { NextRequest, NextResponse, connection } from 'next/server';
import { getStudents, getAttendanceLogs, getSystemSettings, hasNotificationBeenSent, recordNotificationLog } from '@/lib/db';
import { getISOWeekInfo, getWeekDateRange } from '@/lib/rotation';
import { generateWeeklyExcelReport } from '@/lib/excel';
import { sendWhatsAppMessage } from '@/lib/fonnte';

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
    const adminPhone = settings.adminWhatsAppNumber;

    const { isoWeek, isoYear, dateString } = getISOWeekInfo();
    const { startDate, endDate, label } = getWeekDateRange(isoWeek, isoYear);

    // Duplicate check
    const alreadySent = await hasNotificationBeenSent('WEEKLY_RECAP', dateString, adminPhone);
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

    // Generate Excel attachment
    const excelBuffer = await generateWeeklyExcelReport({
      weekLabel: label,
      startDate,
      endDate,
      students,
      attendanceLogs: logs,
    });

    const filename = `Rekap_Piket_SIJA_B_W${isoWeek}_${isoYear}.xlsx`;

    const message = `📊 *REKAPITULASI MINGGUAN PIKET KELAS*

Kelas: ${settings.classLabel}
Periode: ${label} (${startDate} s.d. ${endDate})

📈 *Ringkasan Kehadiran:*
• Total Tugas Selesai Diajukan: ${totalSubmissions}
• Terverifikasi: ${verifiedCount} (${totalSubmissions ? Math.round((verifiedCount / totalSubmissions) * 100) : 0}%)
• Ditolak: ${rejectedCount}
• Menunggu Verifikasi: ${pendingCount}

Dokumen rekapitulasi lengkap terlampir dalam format Microsoft Excel (.xlsx).

🔗 *Dashboard Admin:* ${process.env.APP_URL || 'https://cleanbieber.vercel.app'}/admin/rekap`;

    const sendResult = await sendWhatsAppMessage(adminPhone, message, excelBuffer, filename);

    await recordNotificationLog(
      'WEEKLY_RECAP',
      dateString,
      adminPhone,
      sendResult.success ? 'SUCCESS' : 'FAILED'
    );

    return NextResponse.json({
      success: sendResult.success,
      weekLabel: label,
      recipient: adminPhone,
      fonnteStatus: sendResult.status,
      message: sendResult.message,
    });
  } catch (error) {
    console.error('Error in weekly recap cron:', error);
    return NextResponse.json({ error: 'Internal server error in weekly recap cron' }, { status: 500 });
  }
}
