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
    const isWeekend = todayDayOfWeek > 5;

    // 2. Determine Tomorrow's / Next duty date
    // If today is Friday (5) -> Monday (+3 days)
    // If today is Saturday (6) -> Monday (+2 days)
    // If today is Sunday (7) -> Monday (+1 day)
    // Otherwise -> tomorrow (+1 day)
    let nextDutyDaysToAdd = 1;
    if (todayDayOfWeek === 5) nextDutyDaysToAdd = 3;
    else if (todayDayOfWeek === 6) nextDutyDaysToAdd = 2;
    else if (todayDayOfWeek === 7) nextDutyDaysToAdd = 1;

    const nextDutyDateObj = new Date(todayDateObj);
    nextDutyDateObj.setDate(nextDutyDateObj.getDate() + nextDutyDaysToAdd);
    const nextDutyJakartaStr = nextDutyDateObj.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const nextDutyInfo = getISOWeekInfo(nextDutyDateObj);
    const nextDutyDayOfWeek = nextDutyInfo.dayOfWeek > 5 ? 1 : nextDutyInfo.dayOfWeek;

    // 3. Query Students and Today's Logs
    const [students, todayLogs] = await Promise.all([
      getStudents(),
      getAttendanceLogs({ dateString: nowJakartaStr }),
    ]);

    // Today's assigned students (EMPTY on weekends because Saturday/Sunday has no duty!)
    const todayStudents = isWeekend
      ? []
      : students
          .filter((s) => s.dayOfWeek === todayDayOfWeek)
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

    // Next duty assigned students
    const nextDutyStudents = students
      .filter((s) => s.dayOfWeek === nextDutyDayOfWeek)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const tomorrowAssignments = nextDutyStudents.map((s) => ({
      name: s.name,
      taskName: getAssignedTask(s.dayOfWeek, s.orderIndex, nextDutyInfo.isoWeek, nextDutyInfo.isoYear),
    }));

    // 4. Build text
    const message = buildAdminDailyBriefingText({
      todayDate: nowJakartaStr,
      todayDayOfWeek: todayDayOfWeek,
      isWeekend,
      todayDutyStudents: todayDutyEvaluation,
      tomorrowDate: nextDutyJakartaStr,
      tomorrowDayOfWeek: nextDutyDayOfWeek,
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
