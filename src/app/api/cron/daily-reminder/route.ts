import crypto from 'node:crypto';
import { NextRequest, NextResponse, connection } from 'next/server';
import {
  getStudents,
  getAttendanceLogs,
  getSystemSettings,
  hasNotificationBeenSent,
  recordNotificationLog,
} from '@/lib/db';
import { getISOWeekInfo, getAssignedTask } from '@/lib/rotation';
import { buildAdminDailyBriefingText, sendWhatsAppToMultiple } from '@/lib/fonnte';

function verifyCronSecret(req: NextRequest): boolean {
  // 1. If invoked automatically by Vercel Cron service
  const userAgent = req.headers.get('user-agent') || '';
  const xVercelCron = req.headers.get('x-vercel-cron');
  if (userAgent.startsWith('vercel-cron') || xVercelCron === '1') {
    return true;
  }

  // 2. Allow development environment
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // 3. Fallback to Bearer token authentication (manual trigger or external cron)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'cleanbieber-cron-secret-key-2025';

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

    // 1. Determine Today's date in Asia/Jakarta
    const now = new Date();
    const nowJakartaStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const todayDateObj = new Date(`${nowJakartaStr}T00:00:00+07:00`);
    const todayInfo = getISOWeekInfo(todayDateObj);
    const todayDayOfWeek = todayInfo.dayOfWeek;
    const isWeekend = todayDayOfWeek > 5;

    // 2. Determine Tomorrow's / Next duty date
    let nextDutyDaysToAdd = 1;
    if (todayDayOfWeek === 5) nextDutyDaysToAdd = 3; // Fri -> Mon
    else if (todayDayOfWeek === 6) nextDutyDaysToAdd = 2; // Sat -> Mon
    else if (todayDayOfWeek === 7) nextDutyDaysToAdd = 1; // Sun -> Mon

    const nextDutyDateObj = new Date(todayDateObj);
    nextDutyDateObj.setDate(nextDutyDateObj.getDate() + nextDutyDaysToAdd);
    const nextDutyJakartaStr = nextDutyDateObj.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const nextDutyInfo = getISOWeekInfo(nextDutyDateObj);
    const nextDutyDayOfWeek = nextDutyInfo.dayOfWeek > 5 ? 1 : nextDutyInfo.dayOfWeek;

    // Check duplicate send for primary admin
    const primaryAdmin = adminPhones[0] || '089673038689';
    const alreadySent = await hasNotificationBeenSent('DAILY_REMINDER', nowJakartaStr, primaryAdmin);
    if (alreadySent) {
      return NextResponse.json({
        skipped: true,
        message: `Laporan briefing harian untuk tanggal ${nowJakartaStr} sudah pernah dikirimkan sebelumnya.`,
      });
    }

    // 3. Query Students and Today's Logs
    const [allStudents, todayLogs] = await Promise.all([
      getStudents(),
      getAttendanceLogs({ dateString: nowJakartaStr }),
    ]);

    // Today's duty evaluation (EMPTY on weekends because Saturday/Sunday has no duty!)
    const todayStudents = isWeekend
      ? []
      : allStudents
          .filter((s) => s.dayOfWeek === todayDayOfWeek)
          .sort((a, b) => a.orderIndex - b.orderIndex);

    const todayDutyEvaluation = todayStudents.map((s) => {
      const taskName = getAssignedTask(s.dayOfWeek, s.orderIndex, todayInfo.isoWeek, todayInfo.isoYear);
      const log = todayLogs.find((l) => l.studentId === s.id);

      let status: 'verified' | 'pending' | 'rejected' | 'excused' | 'unsubmitted' = 'unsubmitted';
      if (log) {
        status = log.status;
      }

      return {
        name: s.name,
        taskName,
        status,
        rejectionReason: log?.rejectionReason,
      };
    });

    // Next duty assignments
    const nextDutyStudents = allStudents
      .filter((s) => s.dayOfWeek === nextDutyDayOfWeek)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const tomorrowAssignments = nextDutyStudents.map((s) => ({
      name: s.name,
      taskName: getAssignedTask(s.dayOfWeek, s.orderIndex, nextDutyInfo.isoWeek, nextDutyInfo.isoYear),
    }));

    // 4. Build comprehensive text
    const message = buildAdminDailyBriefingText({
      todayDate: nowJakartaStr,
      todayDayOfWeek: todayDayOfWeek,
      isWeekend,
      todayDutyStudents: todayDutyEvaluation,
      tomorrowDate: nextDutyJakartaStr,
      tomorrowDayOfWeek: nextDutyDayOfWeek,
      tomorrowAssignments,
      classLabel: settings.classLabel,
      appUrl:
        process.env.APP_URL && !process.env.APP_URL.includes('localhost')
          ? process.env.APP_URL
          : 'https://cleanbieber.vercel.app',
    });

    // 5. Send to all admin phones
    const sendResult = await sendWhatsAppToMultiple(adminPhones, message);

    for (const phone of adminPhones) {
      await recordNotificationLog(
        'DAILY_REMINDER',
        nowJakartaStr,
        phone,
        sendResult.sent > 0 ? 'SUCCESS' : 'FAILED'
      );
    }

    return NextResponse.json({
      success: sendResult.sent > 0,
      todayDate: nowJakartaStr,
      tomorrowDate: nextDutyJakartaStr,
      recipients: adminPhones,
      sendResult,
      message,
    });
  } catch (error) {
    console.error('Error in daily reminder cron:', error);
    return NextResponse.json({ error: 'Internal server error in daily reminder cron' }, { status: 500 });
  }
}
