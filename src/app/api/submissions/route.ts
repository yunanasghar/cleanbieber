import { NextRequest, NextResponse, connection } from 'next/server';
import { getStudentById, getAttendanceLogs, createAttendanceLog } from '@/lib/db';
import { getISOWeekInfo, getAssignedTask } from '@/lib/rotation';
import { uploadEvidencePhoto } from '@/lib/cloudinary';
import { analyzeCleaningEvidence } from '@/lib/gemini';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const logs = await getAttendanceLogs({
      dateString,
      status,
      studentId,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Gagal memuat data pengajuan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const studentId = formData.get('studentId') as string;
    const targetDate = formData.get('date') as string; // "YYYY-MM-DD"
    const file = formData.get('photo') as File | null;

    if (!studentId || !targetDate || !file) {
      return NextResponse.json(
        { error: 'Nama siswa, tanggal piket, dan foto bukti wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Verify student exists
    const student = await getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Data siswa tidak ditemukan di dalam sistem.' }, { status: 404 });
    }

    // 2. Validate date and calculate ISO week info
    const dateObj = new Date(`${targetDate}T00:00:00+07:00`);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Format tanggal tidak valid.' }, { status: 400 });
    }

    const { isoWeek, isoYear, dayOfWeek, dateString } = getISOWeekInfo(dateObj);

    // Verify whether the student is assigned to this day of week
    if (student.dayOfWeek !== dayOfWeek) {
      return NextResponse.json(
        {
          error: `Hari piket ${student.name} bukan hari ini. Hari jadwal tetap: hari ke-${student.dayOfWeek}.`,
        },
        { status: 400 }
      );
    }

    // Calculate deterministic assigned task for this student
    const assignedTask = getAssignedTask(student.dayOfWeek, student.orderIndex, isoWeek, isoYear);

    // 3. Duplicate submission check
    const existingLogs = await getAttendanceLogs({
      dateString,
      studentId: student.id,
    });

    const alreadySubmitted = existingLogs.some((l) => l.taskName === assignedTask && l.status !== 'rejected');
    if (alreadySubmitted) {
      return NextResponse.json(
        {
          error: `Bukti piket untuk ${student.name} pada tugas "${assignedTask}" tanggal ${dateString} sudah diajukan sebelumnya.`,
        },
        { status: 409 }
      );
    }

    // 4. File validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format berkas tidak didukung. Harap unggah foto berekstensi JPG, PNG, atau WEBP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran foto melebihi batas maksimal 5 MB. Silakan kompres atau pilih foto lain.' },
        { status: 400 }
      );
    }

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // 5. Upload to temporary storage
    const uploadResult = await uploadEvidencePhoto(buffer, file.type, `piket_${student.name.replace(/\s+/g, '_')}`);

    // 6. Analyze with Gemini Vision AI
    const aiResult = await analyzeCleaningEvidence(base64Data, file.type, assignedTask);

    // 7. Save attendance log
    const created = await createAttendanceLog({
      dateString,
      studentId: student.id,
      studentName: student.name,
      dayOfWeek: student.dayOfWeek,
      taskName: assignedTask,
      tempPhotoUrl: uploadResult.url,
      photoPublicId: uploadResult.publicId,
      aiStatus: aiResult.aiStatus,
      aiConfidence: aiResult.confidence,
      aiDetectedItems: aiResult.detectedItems,
      aiReason: aiResult.reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti piket berhasil diunggah dan sedang menunggu verifikasi admin.',
      submission: created,
    });
  } catch (error) {
    console.error('Submission upload error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal saat memproses unggahan.' }, { status: 500 });
  }
}
