import { describe, expect, test } from 'vitest';
import { filterTasks } from './filters';
import type { Task } from '../types';

/**
 * ============================================================
 *  Ujian fungsi tulen filterTasks — carian judul, penapis label,
 *  assignee dan tarikh akhir, serta gabungan kriteria (AND).
 * ============================================================
 */

/** Bina task fixture ringkas dengan nilai lalai yang boleh ditindih. */
const makeTask = (overrides: Partial<Task> & { id: string }): Task => ({
  title: 'Task contoh',
  description: '',
  columnId: 'todo',
  label: 'Feature',
  assignees: [],
  dueDate: '',
  subtasks: [],
  attachments: [],
  ...overrides,
});

/** Tarikh ISO tempatan (YYYY-MM-DD) bagi hari ini dengan ofsset hari. */
const dateFromToday = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Kriteria lalai — tiada penapis aktif. */
const noFilter = {
  query: '',
  label: null,
  assigneeId: null,
  due: 'all' as const,
};

describe('filterTasks', () => {
  test('tiada kriteria aktif → semua task dikembalikan', () => {
    const tasks = [
      makeTask({ id: 'a' }),
      makeTask({ id: 'b', label: 'Bug' }),
      makeTask({ id: 'c' }),
    ];
    expect(filterTasks(tasks, noFilter)).toHaveLength(3);
  });

  test('carian judul: sepadan sebahagian, tidak peka huruf & ditrim', () => {
    const tasks = [
      makeTask({ id: 'a', title: 'Implement Dark Mode Toggle' }),
      makeTask({ id: 'b', title: 'Fix crash on upload' }),
    ];
    const hasil = filterTasks(tasks, { ...noFilter, query: '  dark mode ' });
    expect(hasil).toHaveLength(1);
    expect(hasil[0]?.id).toBe('a');
  });

  test('penapis label mengembalikan hanya task dengan label sepadan', () => {
    const tasks = [
      makeTask({ id: 'a', label: 'Feature' }),
      makeTask({ id: 'b', label: 'Bug' }),
      makeTask({ id: 'c', label: 'Undefined' }),
    ];
    const hasil = filterTasks(tasks, { ...noFilter, label: 'Bug' });
    expect(hasil).toHaveLength(1);
    expect(hasil[0]?.id).toBe('b');
  });

  test('penapis assignee memadankan mana-mana assignee pada task', () => {
    const tasks = [
      makeTask({
        id: 'a',
        assignees: [{ id: 'usr-1', name: 'Rizky', avatar: '' }],
      }),
      makeTask({
        id: 'b',
        assignees: [{ id: 'usr-2', name: 'Dewi', avatar: '' }],
      }),
      makeTask({
        id: 'c',
        assignees: [
          { id: 'usr-3', name: 'Ahmad', avatar: '' },
          { id: 'usr-1', name: 'Rizky', avatar: '' },
        ],
      }),
    ];
    const hasil = filterTasks(tasks, { ...noFilter, assigneeId: 'usr-1' });
    expect(hasil).toHaveLength(2);
    expect(hasil.map((task) => task.id)).toEqual(['a', 'c']);
  });

  test('penapis Tertunggak: tarikh lewat & bukan kolom Done sahaja', () => {
    const tasks = [
      // Sudah lewat tarikh, belum selesai → tertunggak.
      makeTask({ id: 'a', dueDate: dateFromToday(-1) }),
      // Sudah lewat tarikh tetapi dalam kolom Done → tidak dikira.
      makeTask({ id: 'b', dueDate: dateFromToday(-2), columnId: 'done' }),
      // Tarikh hari ini → belum tertunggak.
      makeTask({ id: 'c', dueDate: dateFromToday(0) }),
      // Tiada tarikh akhir → diketepikan.
      makeTask({ id: 'd', dueDate: '' }),
    ];
    const hasil = filterTasks(tasks, { ...noFilter, due: 'overdue' });
    expect(hasil).toHaveLength(1);
    expect(hasil[0]?.id).toBe('a');
  });

  test('penapis Hari Ini memadankan hanya tarikh akhir hari ini', () => {
    const tasks = [
      makeTask({ id: 'a', dueDate: dateFromToday(0) }),
      makeTask({ id: 'b', dueDate: dateFromToday(1) }),
      makeTask({ id: 'c', dueDate: dateFromToday(-1) }),
    ];
    const hasil = filterTasks(tasks, { ...noFilter, due: 'today' });
    expect(hasil).toHaveLength(1);
    expect(hasil[0]?.id).toBe('a');
  });

  test('penapis 7 Hari memadankan tarikh akhir dalam tempoh seminggu', () => {
    const tasks = [
      // Hari ini ✓
      makeTask({ id: 'a', dueDate: dateFromToday(0) }),
      // Sempadan tepat 7 hari ✓
      makeTask({ id: 'b', dueDate: dateFromToday(7) }),
      // Luar tempoh 7 hari.
      makeTask({ id: 'c', dueDate: dateFromToday(10) }),
      // Sudah lewat — bukan "7 hari akan datang".
      makeTask({ id: 'd', dueDate: dateFromToday(-1) }),
    ];
    const hasil = filterTasks(tasks, { ...noFilter, due: 'week' });
    expect(hasil).toHaveLength(2);
    expect(hasil.map((task) => task.id)).toEqual(['a', 'b']);
  });

  test('gabungan kriteria (AND): carian + label + assignee serentak', () => {
    const tasks = [
      makeTask({
        id: 'a',
        title: 'Fix dark mode bug',
        label: 'Bug',
        assignees: [{ id: 'usr-1', name: 'Rizky', avatar: '' }],
      }),
      makeTask({
        id: 'b',
        title: 'Fix dark mode bug',
        label: 'Feature',
        assignees: [{ id: 'usr-1', name: 'Rizky', avatar: '' }],
      }),
      makeTask({
        id: 'c',
        title: 'Fix dark mode bug',
        label: 'Bug',
        assignees: [{ id: 'usr-2', name: 'Dewi', avatar: '' }],
      }),
    ];
    const hasil = filterTasks(tasks, {
      query: 'dark mode',
      label: 'Bug',
      assigneeId: 'usr-1',
      due: 'all',
    });
    expect(hasil).toHaveLength(1);
    expect(hasil[0]?.id).toBe('a');
  });
});
