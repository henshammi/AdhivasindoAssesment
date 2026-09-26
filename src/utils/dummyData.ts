/**
 * ============================================================
 *  Dummy Data — Task Management Board
 * ------------------------------------------------------------
 *  Set data contoh yang digunakan sebagai nilai awal state
 *  sebelum pengguna membuat sebarang perubahan. Data ini akan
 *  ditulis ke LocalStorage oleh `useLocalStorage` apabila
 *  aplikasi dijalankan buat kali pertama.
 * ============================================================
 */

import type { Assignee, Task } from '../types';

/* ------------------------------------------------------------
 * Senarai ahli pasukan contoh
 * ---------------------------------------------------------- */

const assigneeRizky: Assignee = {
  id: 'usr-1',
  name: 'Rizky Pratama',
  avatar: 'https://i.pravatar.cc/80?img=12',
};

const assigneeDewi: Assignee = {
  id: 'usr-2',
  name: 'Dewi Anggraini',
  avatar: 'https://i.pravatar.cc/80?img=47',
};

const assigneeAhmad: Assignee = {
  id: 'usr-3',
  name: 'Ahmad Fauzi',
  avatar: 'https://i.pravatar.cc/80?img=15',
};

const assigneeSiti: Assignee = {
  id: 'usr-4',
  name: 'Siti Rahma',
  avatar: 'https://i.pravatar.cc/80?img=32',
};

// Tanpa gambar avatar — TaskCard akan memaparkan inisial berwarna.
const assigneeBudi: Assignee = {
  id: 'usr-5',
  name: 'Budi Santoso',
  avatar: '',
};

/**
 * Senarai ahli pasukan contoh — akan dipakai sebagai pilihan
 * "Filter by Assignee" pada fasa seterusnya.
 */
export const initialAssignees: Assignee[] = [
  assigneeRizky,
  assigneeDewi,
  assigneeAhmad,
  assigneeSiti,
  assigneeBudi,
];

/* ------------------------------------------------------------
 * Data task permulaan — diedarkan merentasi kelima-lima kolom
 * ---------------------------------------------------------- */

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement dark mode toggle on the settings page',
    description:
      'Add a switch on the settings page to toggle between light and dark themes. The preference must be stored in localStorage so it persists between sessions.',
    columnId: 'todo',
    label: 'Feature',
    priority: 'Medium',
    assignees: [assigneeRizky],
    dueDate: '2026-10-08',
    subtasks: [
      { id: 'task-1-s1', title: 'Build the toggle component', completed: false },
      { id: 'task-1-s2', title: 'Persist preference in localStorage', completed: false },
      { id: 'task-1-s3', title: 'Write unit tests', completed: false },
    ],
    attachments: ['design-spec.pdf'],
  },
  {
    id: 'task-2',
    title: 'Fix crash when uploading files larger than 10 MB',
    description:
      'The upload flow crashes the whole app instead of showing a friendly error message. Reproduced on Android 13 and desktop Chrome.',
    columnId: 'todo',
    label: 'Bug',
    priority: 'High',
    assignees: [assigneeAhmad, assigneeDewi],
    dueDate: '2026-09-29',
    subtasks: [
      { id: 'task-2-s1', title: 'Reproduce the crash locally', completed: true },
      { id: 'task-2-s2', title: 'Validate file size before upload', completed: false },
      { id: 'task-2-s3', title: 'Show IonToast with error message', completed: false },
      { id: 'task-2-s4', title: 'Add regression test', completed: false },
    ],
    attachments: ['crash-report.txt'],
  },
  {
    id: 'task-3',
    title: 'Build filter & search bar for the board',
    description:
      'Board should be filterable by assignee, label and due date, plus a free-text search box for task titles.',
    columnId: 'doing',
    label: 'Feature',
    priority: 'Medium',
    assignees: [assigneeDewi],
    dueDate: '2026-10-05',
    subtasks: [
      { id: 'task-3-s1', title: 'Design filter UI mockup', completed: true },
      { id: 'task-3-s2', title: 'Implement assignee filter', completed: true },
      { id: 'task-3-s3', title: 'Implement label filter', completed: false },
      { id: 'task-3-s4', title: 'Implement due date filter', completed: false },
      { id: 'task-3-s5', title: 'Implement title search input', completed: false },
    ],
    attachments: [],
  },
  {
    id: 'task-4',
    title: 'Slow initial load on the board page',
    description:
      'First paint on the board takes more than 3 seconds on a mid-range phone. Suspect an unoptimized bundle and too many re-renders on mount.',
    columnId: 'doing',
    label: 'Issue',
    priority: 'Low',
    assignees: [assigneeSiti],
    dueDate: '2026-10-12',
    subtasks: [
      { id: 'task-4-s1', title: 'Profile with Chrome DevTools', completed: false },
      { id: 'task-4-s2', title: 'Code-split heavy components', completed: false },
    ],
    attachments: ['performance-report.png'],
  },
  {
    id: 'task-5',
    title: 'Refactor drag & drop logic into a reusable hook',
    description:
      'Extract all drag & drop handling from the board component into a custom hook so it can be reused and tested independently.',
    columnId: 'review',
    label: 'Feature',
    priority: 'High',
    assignees: [assigneeRizky, assigneeBudi],
    dueDate: '2026-09-30',
    subtasks: [
      { id: 'task-5-s1', title: 'Define the hook API', completed: true },
      { id: 'task-5-s2', title: 'Move handlers out of the component', completed: true },
      { id: 'task-5-s3', title: 'Verify board works end-to-end', completed: true },
    ],
    attachments: [],
    // Poin bonus: contoh card dengan gambar muka depan (cover image).
    coverImage: 'https://picsum.photos/seed/adhivasindo-board/640/240',
  },
  {
    id: 'task-6',
    title: 'Update project documentation and setup guide',
    description:
      'README is outdated — document the new scripts, environment variables and the local storage data structure.',
    columnId: 'done',
    label: 'Undefined',
    // `priority` sengaja dibiarkan kosong — medan ini opsional.
    assignees: [assigneeBudi],
    dueDate: '2026-09-18',
    subtasks: [
      { id: 'task-6-s1', title: 'Rewrite quick start section', completed: true },
      { id: 'task-6-s2', title: 'Document data structure', completed: true },
      { id: 'task-6-s3', title: 'Add screenshots', completed: true },
    ],
    attachments: ['README.md'],
  },
  {
    id: 'task-7',
    title: 'Fix misaligned label badge on the task card',
    description:
      'QA found the badge overlapping the card title on small screens. The fix was merged before, but needs rework after the layout regression.',
    columnId: 'rework',
    label: 'Bug',
    priority: 'High',
    assignees: [assigneeAhmad],
    dueDate: '2026-09-25',
    subtasks: [
      { id: 'task-7-s1', title: 'Reproduce the layout issue', completed: true },
      { id: 'task-7-s2', title: 'Patch the CSS and verify on mobile', completed: false },
    ],
    attachments: ['ui-reference.png'],
  },
];
