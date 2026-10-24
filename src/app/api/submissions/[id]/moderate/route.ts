import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAttendanceLogById, moderateAttendanceLog, addAuditLog } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteEvidencePhoto } from '@/lib/cloudinary';

const ModerateSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate Admin
    const admin = await requireAdmin();

    const { id } = await context.params;
    const body = await req.json();
    const parsed = ModerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { status, rejectionReason } = parsed.data;

    // 2. Fetch submission
    const log = await getAttendanceLogById(id);
    if (!log) {
      return NextResponse.json({ error: 'Data pengajuan tidak ditemukan.' }, { status: 404 });
    }

    // 3. Delete temporary image from storage
    let photoDeleted = false;
    if (log.photoPublicId) {
      photoDeleted = await deleteEvidencePhoto(log.photoPublicId);
    }

    // 4. Update attendance log in database
    const updated = await moderateAttendanceLog(id, {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason || 'Bukti piket ditolak oleh admin.' : undefined,
      adminId: admin.id,
      adminName: admin.name,
      clearPhoto: photoDeleted,
    });

    // 5. Audit log
    await addAuditLog(
      status === 'verified' ? 'APPROVE_SUBMISSION' : 'REJECT_SUBMISSION',
      admin.id,
      `${admin.name} ${status === 'verified' ? 'menyetujui' : 'menolak'} piket ${log.studentName} (${log.taskName}, ${log.dateString}).${
        rejectionReason ? ` Alasan: ${rejectionReason}` : ''
      }`
    );

    return NextResponse.json({
      success: true,
      message: status === 'verified' ? 'Bukti piket berhasil disetujui.' : 'Bukti piket berhasil ditolak.',
      submission: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login sebagai administrator.' }, { status: 401 });
    }
    console.error('Moderation error:', error);
    return NextResponse.json({ error: 'Gagal memproses verifikasi pengajuan.' }, { status: 500 });
  }
}
