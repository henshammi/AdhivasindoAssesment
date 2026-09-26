import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import Home from './Home';

/**
 * Integration test for the toast after the Update action (bonus point).
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

describe('Home — Update toast (bonus point)', () => {
  beforeEach(() => {
    // Clear LocalStorage so the dummyData seed is used every time.
    window.localStorage.clear();
  });

  test('Update: blue toast (primary) after a task is updated', async () => {
    render(<Home />);

    // Open the Edit modal by clicking an existing task card.
    fireEvent.click(
      screen.getByText('Implement dark mode toggle on the settings page')
    );
    await flushOverlay();

    // Save without changing anything → Update action.
    fireEvent.click(screen.getByText('Save'));

    // The toast is shown with a blue message & color (primary).
    const toast = document.querySelector(
      'ion-toast'
    ) as IonToastElement | null;
    expect(toast).not.toBeNull();
    expect(toast?.message).toBe('Task updated successfully');
    expect(toast?.color).toBe('primary');
  });
});
