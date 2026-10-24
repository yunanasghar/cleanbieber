import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBaseTaskSlots,
  getAssignedTask,
  getISOWeekInfo,
  calculateDayAssignments,
  getWeekDateRange,
  type TaskType,
} from '../src/lib/rotation.ts';

describe('CleanBieber Rotation Engine Tests', () => {
  it('correctly allocates base task slots for standard days (Mon-Thu: 7 students)', () => {
    for (let day = 1; day <= 4; day++) {
      const slots = getBaseTaskSlots(day);
      assert.equal(slots.length, 7, `Day ${day} must have 7 slots`);
      const mbg = slots.filter((t) => t === 'MBG').length;
      const nyapu = slots.filter((t) => t === 'Nyapu').length;
      const helper = slots.filter((t) => t === 'Helper').length;
      assert.equal(mbg, 4, `Day ${day} must have exactly 4 MBG`);
      assert.equal(nyapu, 2, `Day ${day} must have exactly 2 Nyapu`);
      assert.equal(helper, 1, `Day ${day} must have exactly 1 Helper`);
    }
  });

  it('correctly allocates base task slots for Friday (8 students)', () => {
    const slots = getBaseTaskSlots(5);
    assert.equal(slots.length, 8, 'Friday must have 8 slots');
    const mbg = slots.filter((t) => t === 'MBG').length;
    const nyapu = slots.filter((t) => t === 'Nyapu').length;
    const helper = slots.filter((t) => t === 'Helper').length;
    assert.equal(mbg, 4, 'Friday must have exactly 4 MBG');
    assert.equal(nyapu, 3, 'Friday must have exactly 3 Nyapu');
    assert.equal(helper, 1, 'Friday must have exactly 1 Helper');
  });

  it('guarantees exact task counts for any ISO week across standard days', () => {
    // Test across 52 weeks in 2025 and 2026
    for (let year of [2025, 2026]) {
      for (let week = 1; week <= 52; week++) {
        for (let day = 1; day <= 4; day++) {
          const assignments: TaskType[] = [];
          for (let orderIndex = 0; orderIndex < 7; orderIndex++) {
            assignments.push(getAssignedTask(day, orderIndex, week, year));
          }
          assert.equal(assignments.length, 7);
          assert.equal(assignments.filter((t) => t === 'MBG').length, 4);
          assert.equal(assignments.filter((t) => t === 'Nyapu').length, 2);
          assert.equal(assignments.filter((t) => t === 'Helper').length, 1);
        }
      }
    }
  });

  it('guarantees exact task counts for Friday across 52 weeks', () => {
    for (let year of [2025, 2026]) {
      for (let week = 1; week <= 52; week++) {
        const assignments: TaskType[] = [];
        for (let orderIndex = 0; orderIndex < 8; orderIndex++) {
          assignments.push(getAssignedTask(5, orderIndex, week, year));
        }
        assert.equal(assignments.length, 8);
        assert.equal(assignments.filter((t) => t === 'MBG').length, 4);
        assert.equal(assignments.filter((t) => t === 'Nyapu').length, 3);
        assert.equal(assignments.filter((t) => t === 'Helper').length, 1);
      }
    }
  });

  it('smoothly rotates tasks between consecutive weeks', () => {
    // For student 0 on Monday across consecutive weeks:
    const week1Task = getAssignedTask(1, 0, 10, 2025);
    const week2Task = getAssignedTask(1, 0, 11, 2025);
    const week3Task = getAssignedTask(1, 0, 12, 2025);
    
    // In a 7-slot array, 7 consecutive weeks must cover the cycle
    const tasksAcross7Weeks = new Set<TaskType>();
    for (let w = 1; w <= 7; w++) {
      tasksAcross7Weeks.add(getAssignedTask(1, 0, w, 2025));
    }
    assert.equal(tasksAcross7Weeks.has('MBG'), true);
    assert.equal(tasksAcross7Weeks.has('Nyapu'), true);
    assert.equal(tasksAcross7Weeks.has('Helper'), true);
  });

  it('deterministically calculates ISO week info in Asia/Jakarta', () => {
    // 2025-04-28 was a Monday in week 18 of 2025
    const info = getISOWeekInfo(new Date('2025-04-28T07:00:00+07:00'));
    assert.equal(info.isoYear, 2025);
    assert.equal(info.isoWeek, 18);
    assert.equal(info.dayOfWeek, 1); // Monday
    assert.equal(info.dateString, '2025-04-28');
  });

  it('handles year boundaries smoothly (e.g. week 52 -> week 1)', () => {
    const endOfYear = getISOWeekInfo(new Date('2025-12-29T10:00:00+07:00')); // Monday of Week 1, 2026
    assert.equal(endOfYear.isoYear, 2026);
    assert.equal(endOfYear.isoWeek, 1);

    const taskWeek52 = getAssignedTask(1, 0, 52, 2025);
    const taskWeek1NextYear = getAssignedTask(1, 0, 1, 2026);
    assert.ok(taskWeek52);
    assert.ok(taskWeek1NextYear);
  });

  it('calculateDayAssignments returns complete task metadata', () => {
    const mockStudents = [
      { id: '1', name: 'Ahmad Rizki', orderIndex: 0 },
      { id: '2', name: 'Siti Nurhaliza', orderIndex: 1 },
      { id: '3', name: 'Budi Santoso', orderIndex: 2 },
      { id: '4', name: 'Citra Dewi', orderIndex: 3 },
      { id: '5', name: 'Daffa Pratama', orderIndex: 4 },
      { id: '6', name: 'Nayla Putri', orderIndex: 5 },
      { id: '7', name: 'Rizky Maulana', orderIndex: 6 },
    ];

    const result = calculateDayAssignments(mockStudents, 1, 18, 2025);
    assert.equal(result.length, 7);
    assert.equal(result[0].name, 'Ahmad Rizki');
    assert.ok(result[0].taskName);
    assert.ok(result[0].taskInfo.title);
    assert.ok(result[0].taskInfo.timeRange);
  });
});
