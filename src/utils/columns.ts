/**
 * ============================================================
 *  Board Column Configuration — Task Management Board
 * ------------------------------------------------------------
 *  Single source of truth for the ordering and
 *  display names of the columns, shared by Board & TaskModal.
 * ============================================================
 */

import type { ColumnId } from '../types';

/** Order of the board's main column IDs (left → right). */
export const COLUMN_IDS: ColumnId[] = [
  'todo',
  'doing',
  'review',
  'done',
  'rework',
];

/** Display name for each column. */
export const COLUMN_TITLES: Record<ColumnId, string> = {
  todo: 'To do',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
  rework: 'Rework',
};
