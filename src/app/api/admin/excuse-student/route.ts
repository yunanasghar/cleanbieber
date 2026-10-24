import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { markStudentExcused, removeStudentExcuse, addAuditLog, getStudents } from '@/lib/db';
import type { TaskType } from '@/lib/rotation';

const ExcuseSchema = z.object({
  action: z.enum(['excuse', 'remove']).default('excuse'),
  studentId: z.string().optional(),
  dateString: z.string().optional(),
  taskName: z.enum(['MBG', 'Nyapu & Pel', 'Helper']).optional(),
  excuseType: z.enum(['sakit', 'izin']).default('sakit'),
  reason: z.string().max(200).optional(),
  attendanceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = ExcuseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { action, studentId, dateString, taskName, excuseType, reason, attendanceId } = parsed.data;

    if (action === 'remove') {
      if (!attendanceId) {
        return NextResponse.json({ error: 'attendanceId wajib disertakan untuk menghapus status izin.' }, { status: 400 });
      }
      const removed = await removeStudentExcuse(attendanceId);
      await addAuditLog('REMOVE_EXCUSE', admin.id, `${admin.name} menghapus/membatalkan status dispensasi piket (ID: ${attendanceId}).`);
      return NextResponse.json({ success: true, message: 'Status izin/sakit berhasil dibatalkan.' });
    }

    if (!studentId || !dateString || !taskName) {
      return NextResponse.json({ error: 'studentId, dateString, dan taskName wajib diisi.' }, { status: 400 });
    }

    const allStudents = await getStudents();
    const student = allStudents.find((s) => s.id === studentId);
    const studentName = student ? student.name : 'Siswa';

    const record = await markStudentExcused({
      studentId,
      dateString,
      taskName: taskName as TaskType,
      excuseType,
      reason,
      adminId: admin.id,
      adminName: admin.name,
    });

    const labelType = excuseType === 'sakit' ? 'Sakit' : 'Izin';
    await addAuditLog(
      'MARK_EXCUSED',
      admin.id,
      `${admin.name} menandai ${studentName} sebagai ${labelType} untuk piket ${taskName} pada ${dateString}.${
        reason ? ` Keterangan: ${reason}` : ''
      }`
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil menandai ${studentName} sebagai ${labelType}.`,
      record,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login sebagai administrator.' }, { status: 401 });
    }
    console.error('Error in excuse-student route:', error);
    return NextResponse.json({ error: 'Gagal memproses status sakit/izin siswa.' }, { status: 500 });
  }
}
