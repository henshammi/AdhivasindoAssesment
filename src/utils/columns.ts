/**
 * ============================================================
 *  Konfigurasi Kolom Board — Task Management Board
 * ------------------------------------------------------------
 *  Sumber tunggal (single source of truth) bagi susunan dan
 *  nama paparan kolom, dikongsi oleh Board & TaskModal.
 * ============================================================
 */

import type { ColumnId } from '../types';

/** Susunan ID kolom utama board (kiri → kanan). */
export const COLUMN_IDS: ColumnId[] = [
  'todo',
  'doing',
  'review',
  'done',
  'rework',
];

/** Nama paparan bagi setiap kolom. */
export const COLUMN_TITLES: Record<ColumnId, string> = {
  todo: 'To do',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
  rework: 'Rework',
};
