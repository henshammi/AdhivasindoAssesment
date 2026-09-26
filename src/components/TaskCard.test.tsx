import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import TaskCard from './TaskCard';
import type { Task } from '../types';

/**
 * Tests for the cover image display (bonus point) on TaskCard.
 */

/** Base task fixture — defaults can be overridden per test. */
const makeTask = (overrides: Partial<Task> & { id: string }): Task => ({
  title: 'Test task',
  description: '',
  columnId: 'todo',
  label: 'Feature',
  assignees: [],
  dueDate: '2026-10-01',
  subtasks: [],
  attachments: [],
  ...overrides,
});

describe('TaskCard — cover image (bonus point)', () => {
  test('renders the cover image at the top of the card when coverImage is set', () => {
    const { container } = render(
      <TaskCard
        task={makeTask({
          id: 'a',
          coverImage: 'https://example.com/image.jpg',
        })}
      />
    );

    const cover = container.querySelector<HTMLImageElement>(
      '.task-card__cover'
    );
    expect(cover).not.toBeNull();
    expect(cover?.getAttribute('src')).toBe('https://example.com/image.jpg');
    expect(cover?.getAttribute('alt')).toBe('Cover: Test task');
  });

  test('no cover image element when coverImage is not set', () => {
    const { container } = render(<TaskCard task={makeTask({ id: 'b' })} />);
    expect(container.querySelector('.task-card__cover')).toBeNull();
  });
});

describe('TaskCard — attachment indicator', () => {
  test('renders the icon & file count when attachments is not empty', () => {
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

  test('no attachment indicator when attachments is empty', () => {
    const { container } = render(<TaskCard task={makeTask({ id: 'd' })} />);
    expect(container.querySelector('.task-card__attachments')).toBeNull();
  });
});
