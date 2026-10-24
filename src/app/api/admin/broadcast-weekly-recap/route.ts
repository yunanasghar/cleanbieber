import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getStudents, getAttendanceLogs, getSystemSettings, addAuditLog } from '@/lib/db';
import { getISOWeekInfo, getWeekDateRange } from '@/lib/rotation';
import { generateWeeklyExcelReport } from '@/lib/excel';
import { sendWhatsAppToMultiple } from '@/lib/fonnte';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const settings = await getSystemSettings();
    const adminPhones = settings.adminWhatsAppNumbers;

    // Optional week and year from body
    let week: number;
    let year: number;

    try {
      const body = await req.json();
      week = typeof body.week === 'number' ? body.week : getISOWeekInfo().isoWeek;
      year = typeof body.year === 'number' ? body.year : getISOWeekInfo().isoYear;
    } catch {
      const info = getISOWeekInfo();
      week = info.isoWeek;
      year = info.isoYear;
    }

    const { startDate, endDate, label } = getWeekDateRange(week, year);

    const [students, logs] = await Promise.all([
      getStudents(),
      getAttendanceLogs({ startDate, endDate }),
    ]);

    const totalSubmissions = logs.length;
    const verifiedCount = logs.filter((l) => l.status === 'verified').length;
    const rejectedCount = logs.filter((l) => l.status === 'rejected').length;
    const excusedCount = logs.filter((l) => l.status === 'excused').length;
    const pendingCount = logs.filter((l) => l.status === 'pending').length;

    // Task breakdown
    const mbgLogs = logs.filter((l) => l.taskName === 'MBG');
    const mbgVerified = mbgLogs.filter((l) => l.status === 'verified').length;

    const nyapuLogs = logs.filter((l) => l.taskName === 'Nyapu' || (l.taskName as string) === 'Nyapu & Pel');
    const nyapuVerified = nyapuLogs.filter((l) => l.status === 'verified').length;

    const helperLogs = logs.filter((l) => l.taskName === 'Helper');
    const helperVerified = helperLogs.filter((l) => l.status === 'verified').length;

    const percent = students.length ? Math.round((verifiedCount / students.length) * 100) : 0;

    // Generate Excel attachment buffer
    const excelBuffer = await generateWeeklyExcelReport({
      weekLabel: label,
      startDate,
      endDate,
      students,
      attendanceLogs: logs,
    });

    const filename = `Rekap_Piket_10SIJAB_W${week}_${year}.xlsx`;
    const appUrl = process.env.APP_URL || 'https://cleanbieber.vercel.app';

    const message = `📊 *REKAPITULASI MINGGUAN PIKET — ${settings.classLabel.toUpperCase()}*
📅 *Periode:* ${label} (${startDate} s.d. ${endDate})
━━━━━━━━━━━━━━━━━━━━━

📈 *RINGKASAN KEHADIRAN KELAS (Total 36 Siswa):*
• ✅ Hadir & Terverifikasi: *${verifiedCount} Siswa* (${percent}%)
• 🏥 Izin / Sakit Resmi: *${excusedCount} Siswa*
• ⏳ Menunggu Verifikasi: ${pendingCount} Siswa
• ❌ Tidak Hadir / Ditolak: ${rejectedCount} Siswa

📋 *Rincian Kehadiran per Tugas:*
• 🍱 MBG (Makanan Bergizi): ${mbgVerified}/${mbgLogs.length} selesai
• 🧹 Nyapu Kelas: ${nyapuVerified}/${nyapuLogs.length} selesai
• 🤝 Helper (Koordinator): ${helperVerified}/${helperLogs.length} selesai

📎 *Lampiran Dokumen:*
File rekapitulasi resmi Microsoft Excel (.xlsx) terlampir langsung pada pesan ini.

🔗 Dashboard Admin: ${appUrl}/admin/rekap

_Pesan dikirim secara manual/otomatis ke seluruh admin & pengurus kelas._`;

    // Send WhatsApp to all registered admin numbers
    const sendResult = await sendWhatsAppToMultiple(adminPhones, message, excelBuffer, filename);

    await addAuditLog(
      'BROADCAST_WEEKLY_RECAP',
      admin.id,
      `Kirim rekap mingguan Excel W${week} ${year} ke ${adminPhones.length} nomor admin (${adminPhones.join(', ')})`
    );

    return NextResponse.json({
      success: sendResult.sent > 0,
      totalRecipients: adminPhones.length,
      recipients: adminPhones,
      sendResult,
      messagePreview: message,
      filename,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    console.error('Error broadcasting weekly recap:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal mengirim rekap mingguan' },
      { status: 500 }
    );
  }
}
