import { formatIndonesianDate, DAY_NAMES } from './rotation.ts';
import type { TaskType } from './rotation.ts';
import { getFonnteToken } from './db.ts';

export interface SendWhatsAppResult {
  success: boolean;
  status: 'SENT' | 'NOT_CONFIGURED' | 'FAILED';
  message: string;
  responsePayload?: unknown;
}

export async function sendWhatsAppMessage(
  targetPhone: string,
  message: string,
  attachmentBuffer?: Buffer,
  attachmentFilename?: string
): Promise<SendWhatsAppResult> {
  const token = (await getFonnteToken()) || process.env.FONNTE_TOKEN;

  if (!token) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'FONNTE_TOKEN belum dikonfigurasi di environment server.',
    };
  }

  // Format phone number to clean string (supports comma-separated list of targets)
  const cleanTarget = targetPhone
    .split(',')
    .map((p) => p.replace(/[^\d+]/g, ''))
    .filter(Boolean)
    .join(',');

  if (!cleanTarget) {
    return {
      success: false,
      status: 'FAILED',
      message: 'Nomor WhatsApp tujuan tidak valid.',
    };
  }

  try {
    const url = 'https://api.fonnte.com/send';

    if (attachmentBuffer && attachmentFilename) {
      // Send with attachment using FormData
      const formData = new FormData();
      formData.append('target', cleanTarget);
      formData.append('message', message);
      
      const blob = new Blob([new Uint8Array(attachmentBuffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      formData.append('file', blob, attachmentFilename);
      formData.append('filename', attachmentFilename);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.status) {
        return {
          success: true,
          status: 'SENT',
          message: 'Pesan dan lampiran berhasil dikirim via WhatsApp Fonnte.',
          responsePayload: data,
        };
      }
      return {
        success: false,
        status: 'FAILED',
        message: data.reason || 'Fonnte menolak pengiriman lampiran.',
        responsePayload: data,
      };
    } else {
      // Text-only message
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          target: cleanTarget,
          message,
          countryCode: '62',
        }),
      });

      const data = await res.json();
      if (res.ok && data.status) {
        return {
          success: true,
          status: 'SENT',
          message: 'Pesan teks berhasil dikirim via WhatsApp Fonnte.',
          responsePayload: data,
        };
      }
      return {
        success: false,
        status: 'FAILED',
        message: data.reason || 'Fonnte menolak pengiriman pesan.',
        responsePayload: data,
      };
    }
  } catch (error) {
    console.error('Error sending WhatsApp message via Fonnte:', error);
    return {
      success: false,
      status: 'FAILED',
      message: error instanceof Error ? error.message : 'Kesalahan jaringan saat menghubungi Fonnte API.',
    };
  }
}

/**
 * Build the Indonesian text format for daily reminder
 */
export function buildDailyReminderText(params: {
  targetDate: string; // "YYYY-MM-DD"
  dayOfWeek: number;
  classLabel?: string;
  appUrl?: string;
  assignments: Array<{ name: string; taskName: TaskType }>;
}): string {
  const { targetDate, assignments } = params;
  const formattedDate = formatIndonesianDate(new Date(`${targetDate}T00:00:00+07:00`));
  const classLabel = params.classLabel || 'Kelas 10 SIJA B';
  const appUrl = params.appUrl || process.env.APP_URL || 'https://cleanbieber.vercel.app';

  const mbgStudents = assignments.filter((a) => a.taskName === 'MBG');
  const nyapuStudents = assignments.filter((a) => a.taskName === 'Nyapu' || (a.taskName as string) === 'Nyapu & Pel');
  const helperStudents = assignments.filter((a) => a.taskName === 'Helper');

  const mbgList = mbgStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
  const nyapuList = nyapuStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
  const helperList = helperStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n');

  return `📢 *PENGINGAT PIKET KELAS*

Hari/Tanggal: ${formattedDate}
Kelas: ${classLabel}
Total petugas: ${assignments.length} siswa

🍱 *MBG (Makanan Bergizi Gratis) — ${mbgStudents.length} orang*
${mbgList}

🧹 *Nyapu — ${nyapuStudents.length} orang*
${nyapuList}

🤝 *Helper — ${helperStudents.length} orang*
${helperList}

🔗 *Dashboard Admin:* ${appUrl}/admin
📸 *Upload Bukti:* ${appUrl}/unggah

_Catatan: Pesan ini adalah pengingat pembagian tugas piket, bukan bukti kehadiran piket yang telah selesai. Siswa wajib mengunggah foto bukti kebersihan pada tautan di atas._`;
}

/**
 * Send WhatsApp message to multiple admin phone numbers
 */
export async function sendWhatsAppToMultiple(
  recipients: string[],
  message: string,
  attachmentBuffer?: Buffer,
  attachmentFilename?: string
): Promise<{ total: number; sent: number; results: SendWhatsAppResult[] }> {
  const cleanRecipients = Array.from(
    new Set(
      recipients
        .map((r) => r.replace(/[^\d+]/g, ''))
        .filter(Boolean)
    )
  );

  if (!cleanRecipients.length) {
    return {
      total: 0,
      sent: 0,
      results: [
        {
          success: false,
          status: 'FAILED',
          message: 'Tidak ada nomor WhatsApp tujuan yang valid.',
        },
      ],
    };
  }

  // Fonnte supports comma-separated targets directly in one call:
  const targetString = cleanRecipients.join(',');
  const res = await sendWhatsAppMessage(targetString, message, attachmentBuffer, attachmentFilename);
  return {
    total: cleanRecipients.length,
    sent: res.success ? cleanRecipients.length : 0,
    results: [res],
  };
}

/**
 * Build the comprehensive daily briefing text for Admins:
 * - Today's piket performance: who verified, who hasn't confirmed/uploaded (URGENT), who rejected
 * - Tomorrow's piket schedule & task distribution
 */
export function buildAdminDailyBriefingText(params: {
  todayDate: string; // "YYYY-MM-DD"
  todayDayOfWeek: number;
  isWeekend?: boolean;
  todayDutyStudents: Array<{
    name: string;
    taskName: TaskType;
    status: 'verified' | 'pending' | 'rejected' | 'excused' | 'unsubmitted';
    rejectionReason?: string | null;
  }>;
  tomorrowDate: string; // "YYYY-MM-DD"
  tomorrowDayOfWeek: number;
  tomorrowAssignments: Array<{
    name: string;
    taskName: TaskType;
  }>;
  classLabel?: string;
  appUrl?: string;
}): string {
  const classLabel = params.classLabel || 'Kelas 10 SIJA B';
  const appUrl = params.appUrl || process.env.APP_URL || 'https://cleanbieber.vercel.app';

  const isWeekend = params.isWeekend ?? (params.todayDayOfWeek > 5);
  const todayFormatted = formatIndonesianDate(new Date(`${params.todayDate}T00:00:00+07:00`));
  const tomorrowFormatted = formatIndonesianDate(new Date(`${params.tomorrowDate}T00:00:00+07:00`));

  // Tomorrow duty breakdown
  const tomorrowMbg = params.tomorrowAssignments.filter((s) => s.taskName === 'MBG');
  const tomorrowNyapu = params.tomorrowAssignments.filter((s) => s.taskName === 'Nyapu' || (s.taskName as string) === 'Nyapu & Pel');
  const tomorrowHelper = params.tomorrowAssignments.filter((s) => s.taskName === 'Helper');

  let text = `🧹 *LAPORAN HARIAN PIKET — ${classLabel.toUpperCase()}*\n`;
  text += `📅 *Hari Ini:* ${todayFormatted}${isWeekend ? ' 🏖️ (Libur Akhir Pekan)' : ''}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (isWeekend || params.todayDutyStudents.length === 0) {
    text += `📊 *EVALUASI KEHADIRAN PIKET HARI INI:*\n`;
    text += `🏖️ *Hari Libur Akhir Pekan*\n`;
    text += `Tidak ada jadwal piket kelas hari ini. Siswa dan kegiatan sekolah libur.\n\n`;
  } else {
    // Categorize today's duty students
    const formatTaskBadge = (task: string) => (task === 'Nyapu & Pel' ? 'Nyapu' : task);
    const verifiedList = params.todayDutyStudents.filter((s) => s.status === 'verified');
    const excusedList = params.todayDutyStudents.filter((s) => s.status === 'excused');
    const pendingReviewList = params.todayDutyStudents.filter((s) => s.status === 'pending');
    const unsubmittedList = params.todayDutyStudents.filter((s) => s.status === 'unsubmitted');
    const rejectedList = params.todayDutyStudents.filter((s) => s.status === 'rejected');

    text += `📊 *EVALUASI KEHADIRAN PIKET HARI INI:*\n\n`;

    // 1. Sudah Hadir & Terverifikasi
    text += `✅ *Hadir & Terverifikasi (${verifiedList.length}/${params.todayDutyStudents.length}):*\n`;
    if (verifiedList.length > 0) {
      text += verifiedList.map((s, i) => `  ${i + 1}. ${s.name} [${formatTaskBadge(s.taskName)}]`).join('\n') + '\n';
    } else {
      text += `  _(Belum ada bukti yang disetujui)_\n`;
    }
    text += `\n`;

    // 2. Pending Verifikasi Admin
    if (pendingReviewList.length > 0) {
      text += `⏳ *Menunggu Verifikasi Admin (${pendingReviewList.length}):*\n`;
      text +=
        pendingReviewList
          .map((s, i) => `  ${i + 1}. ${s.name} [${formatTaskBadge(s.taskName)}] ➔ Foto sudah diunggah, menunggu persetujuan`)
          .join('\n') + '\n\n';
    }

    // 3. Izin / Sakit Resmi (Dispensasi)
    if (excusedList.length > 0) {
      text += `🏥 *Izin / Sakit Resmi (${excusedList.length}):*\n`;
      text +=
        excusedList
          .map(
            (s, i) =>
              `  ${i + 1}. ${s.name} [${formatTaskBadge(s.taskName)}] ➔ ${s.rejectionReason || 'Izin/Sakit resmi terkonfirmasi'}`
          )
          .join('\n') + '\n\n';
    }

    // 4. Belum Konfirmasi / Belum Upload Bukti (Urgent!)
    text += `⚠️ *BELUM KONFIRMASI / BELUM UPLOAD (${unsubmittedList.length}):*\n`;
    if (unsubmittedList.length > 0) {
      text +=
        unsubmittedList
          .map((s, i) => `  ${i + 1}. ${s.name} [${formatTaskBadge(s.taskName)}] ➔ ❗Segera konfirmasi & upload bukti!`)
          .join('\n') + '\n';
    } else {
      text += `  _(Semua petugas hari ini sudah konfirmasi/upload)_\n`;
    }
    text += `\n`;

    // 5. Ditolak / Tidak Piket
    if (rejectedList.length > 0) {
      text += `❌ *Tidak Piket / Bukti Ditolak (${rejectedList.length}):*\n`;
      text +=
        rejectedList
          .map(
            (s, i) =>
              `  ${i + 1}. ${s.name} [${formatTaskBadge(s.taskName)}] ${s.rejectionReason ? `(Alasan: ${s.rejectionReason})` : ''}`
          )
          .join('\n') + '\n\n';
    }
  }

  const nextDutyTitle = isWeekend ? '📋 *JADWAL PIKET BERIKUTNYA:*' : '📋 *JADWAL PIKET BESOK:*';
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `${nextDutyTitle}\n`;
  text += `📅 *${tomorrowFormatted}* (${params.tomorrowAssignments.length} Petugas)\n\n`;

  text += `🍱 *MBG (07:00 - 09:00 WIB):*\n`;
  text += tomorrowMbg.map((s, i) => `  ${i + 1}. ${s.name}`).join('\n') || '  -';
  text += `\n\n`;

  text += `🧹 *Nyapu (15:00 - 16:30 WIB):*\n`;
  text += tomorrowNyapu.map((s, i) => `  ${i + 1}. ${s.name}`).join('\n') || '  -';
  text += `\n\n`;

  text += `🤝 *Helper (Koordinator):*\n`;
  text += tomorrowHelper.map((s, i) => `  ${i + 1}. ${s.name}`).join('\n') || '  -';
  text += `\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📲 *Tindakan Cepat:*\n`;
  text += `• Verifikasi Bukti: ${appUrl}/admin/verifikasi\n`;
  text += `• Formulir Bukti Siswa: ${appUrl}/unggah\n\n`;
  text += `_Notifikasi otomatis CleanBieber untuk Pengurus & Admin Kelas 10 SIJA B._`;

  return text;
}
