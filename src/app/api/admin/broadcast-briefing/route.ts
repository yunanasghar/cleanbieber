import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getStudents, getAttendanceLogs, getSystemSettings, addAuditLog } from '@/lib/db';
import { getISOWeekInfo, getAssignedTask } from '@/lib/rotation';
import { buildAdminDailyBriefingText, sendWhatsAppToMultiple } from '@/lib/fonnte';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const settings = await getSystemSettings();

    // 1. Determine Today's date in Asia/Jakarta
    const now = new Date();
    const nowJakartaStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
    const todayDateObj = new Date(`${nowJakartaStr}T00:00:00+07:00`);
    const todayInfo = getISOWeekInfo(todayDateObj);
    const todayDayOfWeek = todayInfo.dayOfWeek; // 1 = Senin, ... 5 = Jumat, 6 = Sabtu, 7 = Minggu

    // Active duty day for today (if weekend, default Monday)
    const activeDutyDay = todayDayOfWeek > 5 ? 1 : todayDayOfWeek;

    // 2. Determine Tomorrow's duty date
    // If today is Friday (5) or Saturday (6), tomorrow's duty is Monday
    let tomorrowDaysToAdd = 1;
    if (todayDayOfWeek === 5) tomorrowDaysToAdd = 3; // Fri -> Mon
    else if (todayDayOfWeek === 6) tomorrowDaysToAdd = 2; // Sat -> Mon

    const tomorrowDateObj = new Date(todayDateObj);
    tomorrowDateObj.setDate(tomorrowDateObj.getDate() + tomorrowDaysToAdd);
    const tomorrowJakartaStr = tomorrowDateObj.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const tomorrowInfo = getISOWeekInfo(tomorrowDateObj);
    const tomorrowDayOfWeek = tomorrowInfo.dayOfWeek > 5 ? 1 : tomorrowInfo.dayOfWeek;

    // 3. Query Students and Today's Logs
    const [students, todayLogs] = await Promise.all([
      getStudents(),
      getAttendanceLogs({ dateString: nowJakartaStr }),
    ]);

    // Today's assigned students
    const todayStudents = students
      .filter((s) => s.dayOfWeek === activeDutyDay)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const todayDutyEvaluation = todayStudents.map((s) => {
      const taskName = getAssignedTask(s.dayOfWeek, s.orderIndex, todayInfo.isoWeek, todayInfo.isoYear);
      const log = todayLogs.find((l) => l.studentId === s.id);

      let status: 'verified' | 'pending' | 'rejected' | 'excused' | 'unsubmitted' = 'unsubmitted';
      if (log) {
        status = log.status; // 'verified' | 'pending' | 'rejected' | 'excused'
      }

      return {
        name: s.name,
        taskName,
        status,
        rejectionReason: log?.rejectionReason,
      };
    });

    // Tomorrow's assigned students
    const tomorrowStudents = students
      .filter((s) => s.dayOfWeek === tomorrowDayOfWeek)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const tomorrowAssignments = tomorrowStudents.map((s) => ({
      name: s.name,
      taskName: getAssignedTask(s.dayOfWeek, s.orderIndex, tomorrowInfo.isoWeek, tomorrowInfo.isoYear),
    }));

    // 4. Build text
    const message = buildAdminDailyBriefingText({
      todayDate: nowJakartaStr,
      todayDayOfWeek: activeDutyDay,
      todayDutyStudents: todayDutyEvaluation,
      tomorrowDate: tomorrowJakartaStr,
      tomorrowDayOfWeek: tomorrowDayOfWeek,
      tomorrowAssignments,
      classLabel: settings.classLabel,
      appUrl: process.env.APP_URL || 'https://cleanbieber.vercel.app',
    });

    // 5. Send to all configured admin WhatsApp numbers
    const recipients = settings.adminWhatsAppNumbers;
    const sendResult = await sendWhatsAppToMultiple(recipients, message);

    await addAuditLog(
      'BROADCAST_ADMIN_BRIEFING',
      admin.id,
      `Broadcast laporan briefing harian dikirim ke ${recipients.length} nomor admin (${recipients.join(', ')})`
    );

    return NextResponse.json({
      success: sendResult.sent > 0,
      totalRecipients: recipients.length,
      recipients,
      sendResult,
      messagePreview: message,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    console.error('Broadcast briefing error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengirim broadcast briefing' },
      { status: 500 }
    );
  }
}
