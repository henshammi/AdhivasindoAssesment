import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import Board from './Board';
import { initialTasks } from '../utils/dummyData';

/**
 * Flush async @hello-pangea/dnd updates on mount — dnd measures
 * dimensions via requestAnimationFrame and updates its internal
 * state (StackManager) after render. This flush avoids act(...) warnings.
 */
const flushDndUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
};

/** Render Board with controlled props as used in Home. */
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
  test('renders all five main board columns', async () => {
    renderBoard();
    await flushDndUpdates();

    expect(screen.getByText('To do')).toBeDefined();
    expect(screen.getByText('Doing')).toBeDefined();
    expect(screen.getByText('Review')).toBeDefined();
    expect(screen.getByText('Done')).toBeDefined();
    expect(screen.getByText('Rework')).toBeDefined();
  });

  test('renders the 7 dummy tasks across their respective columns', async () => {
    const { container } = renderBoard();
    await flushDndUpdates();

    // 7 TaskCard cards from initialTasks
    expect(container.querySelectorAll('.task-card')).toHaveLength(7);

    // Each column displays the correct dummy tasks
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
