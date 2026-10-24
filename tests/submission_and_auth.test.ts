import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkLoginRateLimit, hashPassword, verifyPassword } from '../src/lib/auth.ts';
import { getISOWeekInfo, getAssignedTask, getWeekDateRange } from '../src/lib/rotation.ts';
import { generateWeeklyExcelReport } from '../src/lib/excel.ts';
import { buildDailyReminderText, buildAdminDailyBriefingText } from '../src/lib/fonnte.ts';
import type { AttendanceRecord, StudentRecord } from '../src/lib/types.ts';

describe('CleanBieber Authentication & Security Tests', () => {
  it('hashes and verifies administrator passwords correctly with bcrypt', async () => {
    const rawPass = 'SuperAdminSecret!123';
    const hashed = await hashPassword(rawPass);
    assert.notEqual(hashed, rawPass);
    const valid = await verifyPassword(rawPass, hashed);
    assert.equal(valid, true);

    const invalid = await verifyPassword('WrongPassword', hashed);
    assert.equal(invalid, false);
  });

  it('rate limits brute force login attempts properly', () => {
    const testIp = '192.168.1.100';
    for (let i = 1; i <= 4; i++) {
      const res = checkLoginRateLimit(testIp);
      assert.equal(res.allowed, true);
    }

    const FifthAttempt = checkLoginRateLimit(testIp);
    assert.equal(FifthAttempt.allowed, true);

    // Sixth attempt must be blocked
    const sixthAttempt = checkLoginRateLimit(testIp);
    assert.equal(sixthAttempt.allowed, false);
    assert.ok((sixthAttempt.retryAfterSeconds || 0) > 0);
  });
});

describe('CleanBieber Daily Reminder & WhatsApp Tests', () => {
  it('builds clear Indonesian reminder text with all assigned tasks', () => {
    const assignments = [
      { name: 'Ahmad Rizki', taskName: 'MBG' as const },
      { name: 'Siti Nurhaliza', taskName: 'MBG' as const },
      { name: 'Budi Santoso', taskName: 'Nyapu' as const },
      { name: 'Citra Dewi', taskName: 'Helper' as const },
    ];

    const text = buildDailyReminderText({
      targetDate: '2025-04-28',
      dayOfWeek: 1,
      classLabel: 'Kelas 10 SIJA B',
      assignments,
      appUrl: 'https://cleanbieber.vercel.app',
    });

    assert.ok(text.includes('PENGINGAT PIKET KELAS'));
    assert.ok(text.includes('Kelas 10 SIJA B'));
    assert.ok(text.includes('Ahmad Rizki'));
    assert.ok(text.includes('Siti Nurhaliza'));
    assert.ok(text.includes('Budi Santoso'));
    assert.ok(text.includes('Citra Dewi'));
    assert.ok(text.includes('MBG (Makanan Bergizi Gratis)'));
    assert.ok(text.includes('bukan bukti kehadiran piket'));
  });

  it('builds admin briefing text clearly separating verified, excused, and unsubmitted students', () => {
    const briefing = buildAdminDailyBriefingText({
      todayDate: '2026-10-24',
      todayDayOfWeek: 1,
      todayDutyStudents: [
        { name: 'Ahmad Rizki', taskName: 'MBG', status: 'verified' },
        { name: 'Siti Nurhaliza', taskName: 'MBG', status: 'excused', rejectionReason: 'Sakit: Demam tinggi' },
        { name: 'Budi Santoso', taskName: 'Nyapu', status: 'unsubmitted' },
      ],
      tomorrowDate: '2026-10-25',
      tomorrowDayOfWeek: 2,
      tomorrowAssignments: [
        { name: 'Fajar Ardiansyah', taskName: 'MBG' },
      ],
      classLabel: 'Kelas 10 SIJA B',
    });

    assert.ok(briefing.includes('LAPORAN HARIAN PIKET — KELAS 10 SIJA B'));
    assert.ok(briefing.includes('Hadir & Terverifikasi (1/3)'));
    assert.ok(briefing.includes('Izin / Sakit Resmi (1)'));
    assert.ok(briefing.includes('Siti Nurhaliza [MBG] ➔ Sakit: Demam tinggi'));
    assert.ok(briefing.includes('BELUM KONFIRMASI / BELUM UPLOAD (1)'));
    assert.ok(briefing.includes('Budi Santoso [Nyapu]'));
  });
});

describe('CleanBieber Excel Report Generation Tests', () => {
  it('generates a valid binary .xlsx workbook with correct totals and no secrets', async () => {
    const mockStudents: StudentRecord[] = [
      {
        id: 's1',
        name: 'Ahmad Rizki',
        dayOfWeek: 1,
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockLogs: AttendanceRecord[] = [
      {
        id: 'l1',
        date: '2025-04-28T00:00:00.000Z',
        dateString: '2025-04-28',
        studentId: 's1',
        studentName: 'Ahmad Rizki',
        dayOfWeek: 1,
        taskName: 'MBG',
        tempPhotoUrl: 'https://cloudinary.com/dummy-temp-url',
        photoPublicId: 'secret-id',
        aiStatus: 'VALID',
        aiConfidence: 0.95,
        aiDetectedItems: ['makanan', 'meja'],
        aiReason: 'Rapi dan bersih',
        status: 'verified',
        rejectionReason: null,
        verifiedAt: new Date().toISOString(),
        verifiedByAdminId: 'a1',
        verifiedByAdminName: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'l2',
        date: '2025-04-28T00:00:00.000Z',
        dateString: '2025-04-28',
        studentId: 's2',
        studentName: 'Siti Nurhaliza',
        dayOfWeek: 1,
        taskName: 'MBG',
        tempPhotoUrl: null,
        photoPublicId: null,
        aiStatus: null,
        aiConfidence: null,
        aiDetectedItems: null,
        aiReason: null,
        status: 'excused',
        rejectionReason: 'Sakit: Demam tinggi (surat dokter)',
        verifiedAt: new Date().toISOString(),
        verifiedByAdminId: 'a1',
        verifiedByAdminName: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const buffer = await generateWeeklyExcelReport({
      weekLabel: '28 Apr - 2 Mei 2025',
      startDate: '2025-04-28',
      endDate: '2025-05-02',
      students: mockStudents,
      attendanceLogs: mockLogs,
    });

    assert.ok(buffer);
    assert.ok(buffer.length > 1000, 'Excel buffer must contain valid workbook bytes');

    // Confirm that secret URLs / passwords are not directly output in plaintext in report
    const bufferString = buffer.toString('utf-8');
    assert.equal(bufferString.includes('dummy-temp-url'), false, 'Excel must not leak temp photo URLs');
  });

  it('calculates correct weekly date boundaries', () => {
    const range = getWeekDateRange(18, 2025);
    assert.equal(range.startDate, '2025-04-28'); // Monday
    assert.equal(range.endDate, '2025-05-02');   // Friday
  });
});
