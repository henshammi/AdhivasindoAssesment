import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import TaskCard from './TaskCard';
import type { Task } from '../types';

/**
 * Ujian paparan imej muka depan (poin bonus) pada TaskCard.
 */

/** Task fixture asas — nilai lalai boleh ditindih per ujian. */
const makeTask = (overrides: Partial<Task> & { id: string }): Task => ({
  title: 'Task ujian',
  description: '',
  columnId: 'todo',
  label: 'Feature',
  assignees: [],
  dueDate: '2026-10-01',
  subtasks: [],
  attachments: [],
  ...overrides,
});

describe('TaskCard — imej muka depan (poin bonus)', () => {
  test('memaparkan imej cover di bahagian atas card apabila coverImage diisi', () => {
    const { container } = render(
      <TaskCard
        task={makeTask({
          id: 'a',
          coverImage: 'https://contoh.com/imej.jpg',
        })}
      />
    );

    const cover = container.querySelector<HTMLImageElement>(
      '.task-card__cover'
    );
    expect(cover).not.toBeNull();
    expect(cover?.getAttribute('src')).toBe('https://contoh.com/imej.jpg');
    expect(cover?.getAttribute('alt')).toBe('Cover: Task ujian');
  });

  test('tiada elemen imej cover apabila coverImage tidak diisi', () => {
    const { container } = render(<TaskCard task={makeTask({ id: 'b' })} />);
    expect(container.querySelector('.task-card__cover')).toBeNull();
  });
});

describe('TaskCard — penunjuk lampiran (attachments)', () => {
  test('memaparkan ikon & jumlah fail apabila attachments tidak kosong', () => {
    const { container } = render(
      <TaskCard
        task={makeTask({
          id: 'c',
          attachments: ['design-spec.pdf', 'crash-report.txt'],
        })}
      />
    );

    const indicator = container.querySelector('.task-card__attachments');
    expect(indicator).not.toBeNull();
    expect(indicator?.textContent).toBe('2');
  });

  test('tiada penunjuk lampiran apabila attachments kosong', () => {
    const { container } = render(<TaskCard task={makeTask({ id: 'd' })} />);
    expect(container.querySelector('.task-card__attachments')).toBeNull();
  });
});
