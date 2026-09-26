/**
 * ============================================================
 *  Task Filter Utilities — Task Management Board
 * ------------------------------------------------------------
 *  Pure functions to filter the task list based on
 *  title search, label, assignee and due date criteria.
 *  Called by Home before the task list is passed to the Board,
 *  so columns only show the matching tasks.
 * ============================================================
 */

import type { LabelType, Task } from '../types';

/** Due date filter options. */
export type DueFilter = 'all' | 'overdue' | 'today' | 'week';

/** Active filter/search criteria on the board. */
export interface TaskFilterCriteria {
  /** Text search on the task title (case-insensitive). */
  query: string;
  /** Selected label; `null` = all labels. */
  label: LabelType | null;
  /** Selected assignee ID; `null` = all assignees. */
  assigneeId: string | null;
  /** Due date filter. */
  due: DueFilter;
}

/** Build a local "YYYY-MM-DD" date string from a Date object. */
const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Add a number of days to today's date and return the local ISO date. */
const addDaysFromToday = (days: number): string => {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return toLocalISODate(next);
};

/**
 * Match a task against the due date filter.
 * Comparing ISO "YYYY-MM-DD" strings is safe because their
 * lexicographic order matches the calendar order.
 */
const matchesDueFilter = (task: Task, due: DueFilter): boolean => {
  if (due === 'all') {
    return true;
  }
  // Tasks without a due date do not match any date filter.
  if (!task.dueDate) {
    return false;
  }

  const today = toLocalISODate(new Date());

  if (due === 'overdue') {
    // Overdue = due date is in the past AND not completed
    // (tasks in the "Done" column are considered completed).
    return task.dueDate < today && task.columnId !== 'done';
  }
  if (due === 'today') {
    return task.dueDate === today;
  }
  // 'week' — due date within 7 days from today.
  return task.dueDate >= today && task.dueDate <= addDaysFromToday(7);
};

/**
 * Filter the task list by ALL active criteria (AND logic).
 * "Empty" criteria (query '' / null / 'all') do not filter anything.
 */
export const filterTasks = (
  tasks: Task[],
  criteria: TaskFilterCriteria
): Task[] => {
  const query = criteria.query.trim().toLowerCase();

  return tasks.filter((task) => {
    // (1) Title search — partial match, case-insensitive.
    if (query && !task.title.toLowerCase().includes(query)) {
      return false;
    }

    // (2) Label filter.
    if (criteria.label && task.label !== criteria.label) {
      return false;
    }

    // (3) Assignee filter — the task must include that assignee.
    if (
      criteria.assigneeId &&
      !task.assignees.some((assignee) => assignee.id === criteria.assigneeId)
    ) {
      return false;
    }

    // (4) Due date filter.
    return matchesDueFilter(task, criteria.due);
  });
};
