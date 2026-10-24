import { formatIndonesianDate, DAY_NAMES } from './rotation.ts';
import type { TaskType } from './rotation.ts';

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
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'FONNTE_TOKEN belum dikonfigurasi di environment server.',
    };
  }

  // Format phone number to clean string
  const cleanTarget = targetPhone.replace(/\D/g, '');

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
  const { targetDate, dayOfWeek, assignments } = params;
  const dayName = DAY_NAMES[dayOfWeek] || 'Hari Kerja';
  const formattedDate = formatIndonesianDate(new Date(`${targetDate}T00:00:00+07:00`));
  const classLabel = params.classLabel || 'Kelas 10 SIJA B';
  const appUrl = params.appUrl || process.env.APP_URL || 'https://cleanbieber.vercel.app';

  const mbgStudents = assignments.filter((a) => a.taskName === 'MBG');
  const nyapuStudents = assignments.filter((a) => a.taskName === 'Nyapu & Pel');
  const helperStudents = assignments.filter((a) => a.taskName === 'Helper');

  const mbgList = mbgStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
  const nyapuList = nyapuStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n');
  const helperList = helperStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n');

  return `📢 *PENGINGAT PIKET KELAS*

Hari/Tanggal: ${dayName}, ${formattedDate}
Kelas: ${classLabel}
Total petugas: ${assignments.length} siswa

🍱 *MBG (Makanan Bergizi Gratis) — ${mbgStudents.length} orang*
${mbgList}

🧹 *Nyapu & Pel — ${nyapuStudents.length} orang*
${nyapuList}

🤝 *Helper — ${helperStudents.length} orang*
${helperList}

🔗 *Dashboard Admin:* ${appUrl}/admin
📸 *Upload Bukti:* ${appUrl}/unggah

_Catatan: Pesan ini adalah pengingat pembagian tugas piket, bukan bukti kehadiran piket yang telah selesai. Siswa wajib mengunggah foto bukti kebersihan pada tautan di atas._`;
}
