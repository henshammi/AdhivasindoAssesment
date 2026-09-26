import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import Board from './Board';
import { initialTasks } from '../utils/dummyData';

/**
 * Basuh kemas kini async @hello-pangea/dnd semasa mount — dnd mengukur
 * dimensi melalui requestAnimationFrame dan mengemas kini state dalaman
 * (StackManager) selepas render. Flush ini mengelak amaran act(...).
 */
const flushDndUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
};

/** Render Board dengan props terkawal seperti penggunaannya di Home. */
const renderBoard = () =>
  render(
    <Board
      tasks={initialTasks}
      setTasks={vi.fn()}
      onAddTask={vi.fn()}
      onOpenTask={vi.fn()}
    />
  );

describe('Board', () => {
  test('memaparkan kelima-lima kolom utama board', async () => {
    renderBoard();
    await flushDndUpdates();

    expect(screen.getByText('To do')).toBeDefined();
    expect(screen.getByText('Doing')).toBeDefined();
    expect(screen.getByText('Review')).toBeDefined();
    expect(screen.getByText('Done')).toBeDefined();
    expect(screen.getByText('Rework')).toBeDefined();
  });

  test('memaparkan 7 task dummy merentasi kolom masing-masing', async () => {
    const { container } = renderBoard();
    await flushDndUpdates();

    // 7 card TaskCard daripada initialTasks
    expect(container.querySelectorAll('.task-card')).toHaveLength(7);

    // Setiap kolom memaparkan task dummy yang betul
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeDefined();
    expect(
      screen.getByText('Fix crash when uploading files larger than 10 MB')
    ).toBeDefined();
    expect(
      screen.getByText('Build filter & search bar for the board')
    ).toBeDefined();
    expect(screen.getByText('Slow initial load on the board page')).toBeDefined();
    expect(
      screen.getByText('Refactor drag & drop logic into a reusable hook')
    ).toBeDefined();
    expect(
      screen.getByText('Update project documentation and setup guide')
    ).toBeDefined();
    expect(
      screen.getByText('Fix misaligned label badge on the task card')
    ).toBeDefined();
  });
});
