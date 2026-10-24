import { NextRequest, NextResponse, connection } from 'next/server';
import { z } from 'zod';
import { getStudents, createStudent, updateStudent, deleteStudent, addAuditLog } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const StudentSchema = z.object({
  name: z.string().min(2, 'Nama siswa minimal 2 karakter'),
  dayOfWeek: z.number().int().min(1).max(5),
  orderIndex: z.number().int().min(0).max(10),
  phoneNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get('day');
    const dayOfWeek = day ? parseInt(day, 10) : undefined;

    const students = await getStudents(dayOfWeek);
    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Gagal memuat data siswa' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = StudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const created = await createStudent(parsed.data);
    await addAuditLog('CREATE_STUDENT', admin.id, `Admin ${admin.name} menambahkan siswa: ${created.name}`);

    return NextResponse.json({ success: true, student: created });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Gagal menambahkan siswa' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID siswa wajib diisi' }, { status: 400 });
    }

    const updated = await updateStudent(id, data);
    if (!updated) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    await addAuditLog('UPDATE_STUDENT', admin.id, `Admin ${admin.name} mengubah data siswa: ${updated.name}`);
    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data siswa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID siswa wajib disertakan' }, { status: 400 });
    }

    const deleted = await deleteStudent(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    await addAuditLog('DELETE_STUDENT', admin.id, `Admin ${admin.name} menghapus data siswa id: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Gagal menghapus siswa' }, { status: 500 });
  }
}
