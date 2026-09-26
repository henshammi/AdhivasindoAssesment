import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import Home from './Home';

/**
 * Integration test for the toast after the Delete action (bonus point).
 *
 * Kept in a separate file because each vitest test file gets a
 * fresh jsdom environment. Ionic overlays (ion-modal) attached to
 * document.body during present() escape React's cleanup between
 * tests in the same file, and their async callbacks can interfere
 * with the next test's DOM queries.
 */
const flushOverlay = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
};

/** ion-toast element with readable host props (message/color). */
type IonToastElement = HTMLElement & {
  message?: string;
  color?: string;
};

describe('Home — Delete toast (bonus point)', () => {
  beforeEach(() => {
    // Clear LocalStorage so the dummyData seed is used every time.
    window.localStorage.clear();
  });

  test('Delete: red toast (danger) after a task is deleted', async () => {
    render(<Home />);

    // Open the Edit modal by clicking an existing task card.
    fireEvent.click(
      screen.getByText('Fix crash when uploading files larger than 10 MB')
    );
    await flushOverlay();

    // The Delete button only exists in Edit mode.
    fireEvent.click(screen.getByText('Delete'));

    // The toast is shown with a red message & color (danger).
    const toast = document.querySelector(
      'ion-toast'
    ) as IonToastElement | null;
    expect(toast).not.toBeNull();
    expect(toast?.message).toBe('Task deleted successfully');
    expect(toast?.color).toBe('danger');
  });
});
