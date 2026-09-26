/**
 * ============================================================
 *  Task Management Board — Definisi Jenis Data (Types)
 * ------------------------------------------------------------
 *  Struktur data asas untuk Kanban Board Adhivasindo.
 *  Semua modul lain (hooks, utils, components) akan mengimport
 *  jenis-jenis data dari fail ini sahaja.
 * ============================================================
 */

/** ID kolom utama pada board Kanban. */
export type ColumnId = 'todo' | 'doing' | 'review' | 'done' | 'rework';

/** Label kategori bagi sesebuah task. */
export type LabelType = 'Feature' | 'Bug' | 'Issue' | 'Undefined';

/** Tahap keutamaan task (opsional). */
export type PriorityType = 'Low' | 'Medium' | 'High';

/** Ahli pasukan yang ditugaskan kepada sesebuah task. */
export interface Assignee {
  /** ID unik assignee, cth: "usr-1" */
  id: string;
  /** Nama penuh assignee */
  name: string;
  /** URL / path gambar profil (avatar) */
  avatar: string;
}

/** Item checklist (subtask) di dalam sesebuah task. */
export interface Subtask {
  /** ID unik subtask, cth: "sub-1" */
  id: string;
  /** Tajuk / keterangan ringkas subtask */
  title: string;
  /** Status subtask (true = selesai) */
  completed: boolean;
}

/** Struktur utama data Task pada board. */
export interface Task {
  /** ID unik task, cth: "task-1" */
  id: string;
  /** Tajuk task */
  title: string;
  /** Keterangan lanjut task */
  description: string;
  /** Kolom tempat task ini berada */
  columnId: ColumnId;
  /** Label kategori task */
  label: LabelType;
  /** Keutamaan task — opsional */
  priority?: PriorityType;
  /** Senarai ahli yang ditugaskan pada task ini */
  assignees: Assignee[];
  /** Tarikh akhir dalam format ISO, cth: "2026-09-30" */
  dueDate: string;
  /** Senarai subtask / checklist untuk progress bar */
  subtasks: Subtask[];
  /** Senarai nama fail attachment / dummy icon */
  attachments: string[];
  /** URL / base64 gambar muka depan card — Poin Bonus */
  coverImage?: string;
}
