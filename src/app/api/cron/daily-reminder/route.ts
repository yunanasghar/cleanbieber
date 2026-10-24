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

    // 1. Determine Today's date in Asia/Jakarta
    const now = new Date();
    const nowJakartaStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const todayDateObj = new Date(`${nowJakartaStr}T00:00:00+07:00`);
    const todayInfo = getISOWeekInfo(todayDateObj);
    const todayDayOfWeek = todayInfo.dayOfWeek;
    const activeDutyDay = todayDayOfWeek > 5 ? 1 : todayDayOfWeek;

    // 2. Determine Tomorrow's duty date
    let tomorrowDaysToAdd = 1;
    if (todayDayOfWeek === 5) tomorrowDaysToAdd = 3;
    else if (todayDayOfWeek === 6) tomorrowDaysToAdd = 2;

    const tomorrowDateObj = new Date(todayDateObj);
    tomorrowDateObj.setDate(tomorrowDateObj.getDate() + tomorrowDaysToAdd);
    const tomorrowJakartaStr = tomorrowDateObj.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const tomorrowInfo = getISOWeekInfo(tomorrowDateObj);
    const tomorrowDayOfWeek = tomorrowInfo.dayOfWeek > 5 ? 1 : tomorrowInfo.dayOfWeek;

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

    // Today's duty evaluation
    const todayStudents = allStudents
      .filter((s) => s.dayOfWeek === activeDutyDay)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const todayDutyEvaluation = todayStudents.map((s) => {
      const taskName = getAssignedTask(s.dayOfWeek, s.orderIndex, todayInfo.isoWeek, todayInfo.isoYear);
      const log = todayLogs.find((l) => l.studentId === s.id);

      let status: 'verified' | 'pending' | 'rejected' | 'unsubmitted' = 'unsubmitted';
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

    // Tomorrow's assignments
    const tomorrowStudents = allStudents
      .filter((s) => s.dayOfWeek === tomorrowDayOfWeek)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const tomorrowAssignments = tomorrowStudents.map((s) => ({
      name: s.name,
      taskName: getAssignedTask(s.dayOfWeek, s.orderIndex, tomorrowInfo.isoWeek, tomorrowInfo.isoYear),
    }));

    // 4. Build comprehensive text
    const message = buildAdminDailyBriefingText({
      todayDate: nowJakartaStr,
      todayDayOfWeek: activeDutyDay,
      todayDutyStudents: todayDutyEvaluation,
      tomorrowDate: tomorrowJakartaStr,
      tomorrowDayOfWeek,
      tomorrowAssignments,
      classLabel: settings.classLabel,
      appUrl: process.env.APP_URL || 'https://cleanbieber.vercel.app',
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
      tomorrowDate: tomorrowJakartaStr,
      recipients: adminPhones,
      sendResult,
      message,
    });
  } catch (error) {
    console.error('Error in daily reminder cron:', error);
    return NextResponse.json({ error: 'Internal server error in daily reminder cron' }, { status: 500 });
  }
}
