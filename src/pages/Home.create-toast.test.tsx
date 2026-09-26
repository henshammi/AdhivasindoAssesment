import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import Home from './Home';

/**
 * Integration test for the toast after the Create action (bonus point).
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

describe('Home — Create toast (bonus point)', () => {
  beforeEach(() => {
    // Clear LocalStorage so the dummyData seed is used every time.
    window.localStorage.clear();
  });

  test('Create: green toast (success) after saving a new task', async () => {
    render(<Home />);

    // Open the Create modal via the "+" button on the first column.
    fireEvent.click(screen.getByLabelText('Add new task to To do column'));
    await flushOverlay();

    // Fill the title so the Save button is enabled, then save.
    const titleInput = document.querySelector('ion-input');
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'Test toast task' } })
    );
    fireEvent.click(screen.getByText('Save'));

    // The toast is shown with a green message & color (success).
    const toast = document.querySelector(
      'ion-toast'
    ) as IonToastElement | null;
    expect(toast).not.toBeNull();
    expect(toast?.message).toBe('Task created successfully');
    expect(toast?.color).toBe('success');
  });
});
