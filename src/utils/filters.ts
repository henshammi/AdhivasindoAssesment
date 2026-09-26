/**
 * ============================================================
 *  Utiliti Penapis Task — Task Management Board
 * ------------------------------------------------------------
 *  Fungsi tulen (pure) untuk menyaring senarai task berdasarkan
 *  kriteria carian judul, label, assignee dan tarikh akhir.
 *  Dipanggil oleh Home sebelum senarai task dihantar ke Board,
 *  supaya kolom hanya memaparkan task yang sepadan.
 * ============================================================
 */

import type { LabelType, Task } from '../types';

/** Pilihan penapis tarikh akhir. */
export type DueFilter = 'all' | 'overdue' | 'today' | 'week';

/** Kriteria penapis/carian aktif pada board. */
export interface TaskFilterCriteria {
  /** Carian teks pada judul task (tidak peka huruf besar/kecil). */
  query: string;
  /** Label yang dipilih; `null` = semua label. */
  label: LabelType | null;
  /** ID assignee yang dipilih; `null` = semua assignee. */
  assigneeId: string | null;
  /** Penapis tarikh akhir. */
  due: DueFilter;
}

/** Bina rentetan tarikh tempatan "YYYY-MM-DD" daripada objek Date. */
const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Tambah beberapa hari kepada tarikh hari ini dan kembalikan ISO tempatan. */
const addDaysFromToday = (days: number): string => {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return toLocalISODate(next);
};

/**
 * Padankan satu task dengan penapis tarikh akhir.
 * Perbandingan rentetan ISO "YYYY-MM-DD" adalah selamat kerana
 * urutan leksikografinya sama dengan urutan kalendar.
 */
const matchesDueFilter = (task: Task, due: DueFilter): boolean => {
  if (due === 'all') {
    return true;
  }
  // Task tanpa tarikh akhir tidak masuk mana-mana penapis tarikh.
  if (!task.dueDate) {
    return false;
  }

  const today = toLocalISODate(new Date());

  if (due === 'overdue') {
    // Tertunggak = tarikh akhir sudah lewat DAN belum selesai
    // (task dalam kolom "Done" dianggap selesai).
    return task.dueDate < today && task.columnId !== 'done';
  }
  if (due === 'today') {
    return task.dueDate === today;
  }
  // 'week' — tarikh akhir dalam tempoh 7 hari dari hari ini.
  return task.dueDate >= today && task.dueDate <= addDaysFromToday(7);
};

/**
 * Saring senarai task mengikut SEMUA kriteria aktif (hubung AND).
 * Kriteria "kosong" (query '' / null / 'all') tidak menyaring apa-apa.
 */
export const filterTasks = (
  tasks: Task[],
  criteria: TaskFilterCriteria
): Task[] => {
  const query = criteria.query.trim().toLowerCase();

  return tasks.filter((task) => {
    // (1) Carian judul — sepadan sebahagian, tidak peka huruf besar/kecil.
    if (query && !task.title.toLowerCase().includes(query)) {
      return false;
    }

    // (2) Penapis label.
    if (criteria.label && task.label !== criteria.label) {
      return false;
    }

    // (3) Penapis assignee — task perlu mempunyai assignee tersebut.
    if (
      criteria.assigneeId &&
      !task.assignees.some((assignee) => assignee.id === criteria.assigneeId)
    ) {
      return false;
    }

    // (4) Penapis tarikh akhir.
    return matchesDueFilter(task, criteria.due);
  });
};
