import ExcelJS from 'exceljs';
import type { AttendanceRecord, StudentRecord } from './types.ts';
import { formatIndonesianDate } from './rotation.ts';

export interface WeeklyReportData {
  weekLabel: string;
  startDate: string;
  endDate: string;
  students: StudentRecord[];
  attendanceLogs: AttendanceRecord[];
}

export async function generateWeeklyExcelReport(data: WeeklyReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CleanBieber System';
  workbook.created = new Date();

  // 1. DETAIL LOG SHEET
  const detailSheet = workbook.addWorksheet('Rekap Kehadiran Piket', {
    views: [{ showGridLines: true }],
  });

  // Title block
  detailSheet.mergeCells('A1:G1');
  const titleCell = detailSheet.getCell('A1');
  titleCell.value = 'REKAPITULASI PIKET KELAS 10 SIJA B';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  detailSheet.getRow(1).height = 30;

  detailSheet.mergeCells('A2:G2');
  const subtitleCell = detailSheet.getCell('A2');
  subtitleCell.value = `Periode: ${data.weekLabel} (${data.startDate} s.d. ${data.endDate})`;
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  detailSheet.getRow(2).height = 20;

  // Header row
  const headers = [
    'No',
    'Nama Siswa',
    'Tanggal Piket',
    'Tugas',
    'Status Verifikasi',
    'Analisis AI (Skor)',
    'Waktu Diverifikasi',
  ];

  const headerRow = detailSheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Sort logs by date and student name
  const sortedLogs = [...data.attendanceLogs].sort((a, b) =>
    a.dateString.localeCompare(b.dateString) || (a.studentName || '').localeCompare(b.studentName || '')
  );

  sortedLogs.forEach((log, index) => {
    const row = detailSheet.addRow([
      index + 1,
      log.studentName || 'Siswa',
      formatIndonesianDate(new Date(`${log.dateString}T00:00:00+07:00`)),
      log.taskName,
      log.status === 'verified'
        ? 'TERVERIFIKASI'
        : log.status === 'rejected'
        ? 'DITOLAK'
        : log.status === 'excused'
        ? `IZIN/SAKIT (${log.rejectionReason || 'Resmi'})`
        : 'MENUNGGU VERIFIKASI',
      log.aiStatus ? `${log.aiStatus} (${Math.round((log.aiConfidence || 0) * 100)}%)` : 'Belum Dianalisis',
      log.verifiedAt ? formatIndonesianDate(new Date(log.verifiedAt)) : '-',
    ]);

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (colNumber === 1 || colNumber === 4 || colNumber === 5 || colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Highlight status badge colors
      if (colNumber === 5) {
        if (log.status === 'verified') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF16A34A' } };
        } else if (log.status === 'rejected') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFDC2626' } };
        } else if (log.status === 'excused') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF2563EB' } };
        } else {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFD97706' } };
        }
      }
    });
  });

  // Column widths
  detailSheet.columns = [
    { width: 6 },
    { width: 28 },
    { width: 26 },
    { width: 16 },
    { width: 28 },
    { width: 22 },
    { width: 24 },
  ];

  // 2. RINGKASAN SHEET
  const summarySheet = workbook.addWorksheet('Ringkasan Statistik');
  summarySheet.mergeCells('A1:C1');
  const sumTitle = summarySheet.getCell('A1');
  sumTitle.value = 'RINGKASAN KEHADIRAN PIKET PER TUGAS';
  sumTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E3A8A' } };
  sumTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 26;

  const sumHeaders = ['Kategori Tugas', 'Total Pengajuan', 'Sudah Diverifikasi', 'Izin / Sakit', 'Ditolak', 'Menunggu'];
  const sumHeaderRow = summarySheet.addRow(sumHeaders);
  sumHeaderRow.height = 24;
  sumHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const tasks = ['MBG', 'Nyapu', 'Helper'] as const;
  tasks.forEach((t) => {
    const subset = data.attendanceLogs.filter((l) =>
      t === 'Nyapu' ? l.taskName === 'Nyapu' || (l.taskName as string) === 'Nyapu & Pel' : l.taskName === t
    );
    const verified = subset.filter((l) => l.status === 'verified').length;
    const excused = subset.filter((l) => l.status === 'excused').length;
    const rejected = subset.filter((l) => l.status === 'rejected').length;
    const pending = subset.filter((l) => l.status === 'pending').length;

    const row = summarySheet.addRow([t, subset.length, verified, excused, rejected, pending]);
    row.height = 20;
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Arial', size: 9 };
    });
  });

  summarySheet.columns = [
    { width: 20 },
    { width: 18 },
    { width: 20 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
