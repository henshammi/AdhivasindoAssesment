import { describe, expect, test } from 'vitest';
import { filterTasks } from './filters';
import type { Task } from '../types';

/**
 * ============================================================
 *  Pure function tests for filterTasks — title search, label,
 *  assignee and due date filters, plus combined criteria (AND).
 * ============================================================
 */

/** Build a simple task fixture with overridable defaults. */
const makeTask = (overrides: Partial<Task> & { id: string }): Task => ({
  title: 'Example task',
  description: '',
  columnId: 'todo',
  label: 'Feature',
  assignees: [],
  dueDate: '',
  subtasks: [],
  attachments: [],
  ...overrides,
});

/** Local ISO date (YYYY-MM-DD) for today with a day offset. */
const dateFromToday = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Default criteria — no active filters. */
const noFilter = {
  query: '',
  label: null,
  assigneeId: null,
  due: 'all' as const,
};

describe('filterTasks', () => {
  test('no active criteria → all tasks are returned', () => {
    const tasks = [
      makeTask({ id: 'a' }),
      makeTask({ id: 'b', label: 'Bug' }),
      makeTask({ id: 'c' }),
    ];
    expect(filterTasks(tasks, noFilter)).toHaveLength(3);
  });

  test('title search: partial match, case-insensitive & trimmed', () => {
    const tasks = [
      makeTask({ id: 'a', title: 'Implement Dark Mode Toggle' }),
      makeTask({ id: 'b', title: 'Fix crash on upload' }),
    ];
    const result = filterTasks(tasks, { ...noFilter, query: '  dark mode ' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
  });

  test('label filter returns only tasks with the matching label', () => {
    const tasks = [
      makeTask({ id: 'a', label: 'Feature' }),
      makeTask({ id: 'b', label: 'Bug' }),
      makeTask({ id: 'c', label: 'Undefined' }),
    ];
    const result = filterTasks(tasks, { ...noFilter, label: 'Bug' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('b');
  });

  test('assignee filter matches any assignee on a task', () => {
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
    const result = filterTasks(tasks, { ...noFilter, assigneeId: 'usr-1' });
    expect(result).toHaveLength(2);
    expect(result.map((task) => task.id)).toEqual(['a', 'c']);
  });

  test('overdue filter: only past-due tasks outside the Done column', () => {
    const tasks = [
      // Past due date, not completed → overdue.
      makeTask({ id: 'a', dueDate: dateFromToday(-1) }),
      // Past due date but in the Done column → not counted.
      makeTask({ id: 'b', dueDate: dateFromToday(-2), columnId: 'done' }),
      // Today's date → not yet overdue.
      makeTask({ id: 'c', dueDate: dateFromToday(0) }),
      // No due date → skipped.
      makeTask({ id: 'd', dueDate: '' }),
    ];
    const result = filterTasks(tasks, { ...noFilter, due: 'overdue' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
  });

  test('today filter matches only due dates of today', () => {
    const tasks = [
      makeTask({ id: 'a', dueDate: dateFromToday(0) }),
      makeTask({ id: 'b', dueDate: dateFromToday(1) }),
      makeTask({ id: 'c', dueDate: dateFromToday(-1) }),
    ];
    const result = filterTasks(tasks, { ...noFilter, due: 'today' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
  });

  test('7-day filter matches due dates within one week', () => {
    const tasks = [
      // Today ✓
      makeTask({ id: 'a', dueDate: dateFromToday(0) }),
      // Exact 7-day boundary ✓
      makeTask({ id: 'b', dueDate: dateFromToday(7) }),
      // Outside the 7-day window.
      makeTask({ id: 'c', dueDate: dateFromToday(10) }),
      // Already past — not "next 7 days".
      makeTask({ id: 'd', dueDate: dateFromToday(-1) }),
    ];
    const result = filterTasks(tasks, { ...noFilter, due: 'week' });
    expect(result).toHaveLength(2);
    expect(result.map((task) => task.id)).toEqual(['a', 'b']);
  });

  test('combined criteria (AND): search + label + assignee at once', () => {
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
    const result = filterTasks(tasks, {
      query: 'dark mode',
      label: 'Bug',
      assigneeId: 'usr-1',
      due: 'all',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('a');
  });
});
