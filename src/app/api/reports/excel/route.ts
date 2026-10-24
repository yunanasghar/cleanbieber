import { NextRequest, NextResponse, connection } from 'next/server';
import { getAttendanceLogs, getStudents } from '@/lib/db';
import { getISOWeekInfo, getWeekDateRange } from '@/lib/rotation';
import { generateWeeklyExcelReport } from '@/lib/excel';

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get('week');
    const yearParam = searchParams.get('year');

    const currentInfo = getISOWeekInfo();
    const isoWeek = weekParam ? parseInt(weekParam, 10) : currentInfo.isoWeek;
    const isoYear = yearParam ? parseInt(yearParam, 10) : currentInfo.isoYear;

    const { startDate, endDate, label } = getWeekDateRange(isoWeek, isoYear);

    const [students, logs] = await Promise.all([
      getStudents(),
      getAttendanceLogs({ startDate, endDate }),
    ]);

    const buffer = await generateWeeklyExcelReport({
      weekLabel: label,
      startDate,
      endDate,
      students,
      attendanceLogs: logs,
    });

    const filename = `Rekap_Piket_SIJA_B_W${isoWeek}_${isoYear}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json({ error: 'Gagal membuat file Excel rekapitulasi' }, { status: 500 });
  }
}
