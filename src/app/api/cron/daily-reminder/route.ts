import crypto from 'node:crypto';
import { NextRequest, NextResponse, connection } from 'next/server';
import { getStudents, getSystemSettings, hasNotificationBeenSent, recordNotificationLog } from '@/lib/db';
import { getISOWeekInfo, getAssignedTask } from '@/lib/rotation';
import { sendWhatsAppMessage, buildDailyReminderText } from '@/lib/fonnte';

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // If CRON_SECRET is not set in development, reject to prevent unauthorized triggers
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

    // Determine tomorrow's date in Asia/Jakarta
    const now = new Date();
    // Add 24 hours to find tomorrow
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const { isoWeek, isoYear, dayOfWeek, dateString } = getISOWeekInfo(tomorrow);

    // If tomorrow is Saturday (6) or Sunday (7), no duty
    if (dayOfWeek > 5) {
      return NextResponse.json({
        skipped: true,
        message: `Besok (${dateString}) adalah akhir pekan, tidak ada jadwal piket kelas.`,
      });
    }

    // Check duplicate send
    const alreadySent = await hasNotificationBeenSent('DAILY_REMINDER', dateString, adminPhone);
    if (alreadySent) {
      return NextResponse.json({
        skipped: true,
        message: `Pengingat piket untuk tanggal ${dateString} sudah pernah dikirimkan sebelumnya.`,
      });
    }

    // Get tomorrow's roster
    const tomorrowStudents = await getStudents(dayOfWeek);
    if (tomorrowStudents.length === 0) {
      return NextResponse.json({
        skipped: true,
        message: `Tidak ada siswa yang terdaftar pada hari ke-${dayOfWeek}.`,
      });
    }

    // Calculate assignments with shared engine
    const assignments = tomorrowStudents.map((s) => ({
      name: s.name,
      taskName: getAssignedTask(dayOfWeek, s.orderIndex, isoWeek, isoYear),
    }));

    // Build message
    const message = buildDailyReminderText({
      targetDate: dateString,
      dayOfWeek,
      classLabel: settings.classLabel,
      assignments,
    });

    // Send WhatsApp
    const sendResult = await sendWhatsAppMessage(adminPhone, message);

    await recordNotificationLog(
      'DAILY_REMINDER',
      dateString,
      adminPhone,
      sendResult.success ? 'SUCCESS' : 'FAILED'
    );

    return NextResponse.json({
      success: sendResult.success,
      targetDate: dateString,
      recipient: adminPhone,
      fonnteStatus: sendResult.status,
      message: sendResult.message,
    });
  } catch (error) {
    console.error('Error in daily reminder cron:', error);
    return NextResponse.json({ error: 'Internal server error in daily reminder cron' }, { status: 500 });
  }
}
