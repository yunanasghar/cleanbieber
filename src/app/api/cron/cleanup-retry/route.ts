import { NextRequest, NextResponse } from 'next/server';
import { getPendingCleanups } from '@/lib/db';
import { deleteEvidencePhoto } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const pending = await getPendingCleanups();
    if (pending.length === 0) {
      return NextResponse.json({ message: 'Tidak ada foto dalam antrean pembersihan.' });
    }

    const results = [];
    for (const item of pending) {
      const success = await deleteEvidencePhoto(item.photoPublicId);
      results.push({ publicId: item.photoPublicId, success });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (error) {
    console.error('Error in cleanup retry cron:', error);
    return NextResponse.json({ error: 'Gagal menjalankan pembersihan foto' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
