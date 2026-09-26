/**
 * ============================================================
 *  Task Management Board — Type Definitions
 * ------------------------------------------------------------
 *  Base data structures for the Adhivasindo Kanban Board.
 *  All other modules (hooks, utils, components) will import
 *  their data types from this file only.
 * ============================================================
 */

/** Primary column ID on the Kanban board. */
export type ColumnId = 'todo' | 'doing' | 'review' | 'done' | 'rework';

/** Category label for a task. */
export type LabelType = 'Feature' | 'Bug' | 'Issue' | 'Undefined';

/** Task priority level (optional). */
export type PriorityType = 'Low' | 'Medium' | 'High';

/** Team member assigned to a task. */
export interface Assignee {
  /** Unique assignee ID, e.g. "usr-1" */
  id: string;
  /** Assignee full name */
  name: string;
  /** Profile picture URL / path (avatar) */
  avatar: string;
}

/** Checklist item (subtask) inside a task. */
export interface Subtask {
  /** Unique subtask ID, e.g. "sub-1" */
  id: string;
  /** Subtask title / short description */
  title: string;
  /** Subtask status (true = completed) */
  completed: boolean;
}

/** Main Task data structure on the board. */
export interface Task {
  /** Unique task ID, e.g. "task-1" */
  id: string;
  /** Task title */
  title: string;
  /** Detailed task description */
  description: string;
  /** Column where this task currently sits */
  columnId: ColumnId;
  /** Task category label */
  label: LabelType;
  /** Task priority — optional */
  priority?: PriorityType;
  /** List of members assigned to this task */
  assignees: Assignee[];
  /** Due date in ISO format, e.g. "2026-09-30" */
  dueDate: string;
  /** List of subtasks / checklist items for the progress bar */
  subtasks: Subtask[];
  /** List of attachment file names / dummy icons */
  attachments: string[];
  /** Card cover image URL / base64 — Bonus Point */
  coverImage?: string;
}
