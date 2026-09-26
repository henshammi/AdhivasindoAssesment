import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import Home from './Home';

/**
 * Integration tests for the Home search bar (Stage 6).
 * IonSearchbar (custom element) receives props through the host element —
 * the search is triggered by dispatching the `ionInput` event directly
 * on the host, mimicking the same pattern used in the TaskModal tests.
 */
describe('Home — search & filters (Stage 6)', () => {
  beforeEach(() => {
    // Clear LocalStorage so the dummyData seed is used every time.
    window.localStorage.clear();
  });

  test('IonSearchbar filters task cards by title in real time', async () => {
    render(<Home />);

    // All seed tasks are displayed on the board before filtering.
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeTruthy();
    expect(
      screen.getByText('Fix crash when uploading files larger than 10 MB')
    ).toBeTruthy();

    // "Type" a search into the ion-searchbar.
    const searchbar = document.querySelector('ion-searchbar');
    expect(searchbar).not.toBeNull();
    await act(async () => {
      searchbar?.dispatchEvent(
        new CustomEvent('ionInput', { detail: { value: 'dark mode' } })
      );
    });

    // Only tasks with a matching title remain visible.
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeTruthy();
    expect(
      screen.queryByText('Fix crash when uploading files larger than 10 MB')
    ).toBeNull();
  });

  test('reset button restores all tasks after an active search', async () => {
    render(<Home />);

    const searchbar = document.querySelector('ion-searchbar');
    await act(async () => {
      searchbar?.dispatchEvent(
        new CustomEvent('ionInput', { detail: { value: 'dark mode' } })
      );
    });
    expect(
      screen.queryByText('Fix crash when uploading files larger than 10 MB')
    ).toBeNull();

    // Reset the filters — the whole board is displayed again.
    fireEvent.click(screen.getByText('Reset'));

    expect(
      screen.getByText('Fix crash when uploading files larger than 10 MB')
    ).toBeTruthy();
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeTruthy();
  });
});
