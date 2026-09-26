import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import Home from './Home';

/**
 * Ujian integrasi bar carian pada Home (Tahap 6).
 * IonSearchbar (element tersuai) menerima props melalui host element —
 * carian dijana dengan memancarkan acara `ionInput` terus pada host,
 * meniru corak yang sama seperti ujian TaskModal.
 */
describe('Home — carian & penapis (Tahap 6)', () => {
  beforeEach(() => {
    // Kosongkan LocalStorage supaya seed dummyData dipakai setiap kali.
    window.localStorage.clear();
  });

  test('IonSearchbar menyaring kad task mengikut judul secara langsung', async () => {
    render(<Home />);

    // Semua task seed dipaparkan pada board sebelum ditapis.
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeTruthy();
    expect(
      screen.getByText('Fix crash when uploading files larger than 10 MB')
    ).toBeTruthy();

    // "Taip" carian pada ion-searchbar.
    const searchbar = document.querySelector('ion-searchbar');
    expect(searchbar).not.toBeNull();
    await act(async () => {
      searchbar?.dispatchEvent(
        new CustomEvent('ionInput', { detail: { value: 'dark mode' } })
      );
    });

    // Hanya task dengan judul sepadan kekal dipapar.
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeTruthy();
    expect(
      screen.queryByText('Fix crash when uploading files larger than 10 MB')
    ).toBeNull();
  });

  test('butang Semula memulihkan semua task selepas carian aktif', async () => {
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

    // Set semula penapis — seluruh board dipapar semula.
    fireEvent.click(screen.getByText('Reset'));

    expect(
      screen.getByText('Fix crash when uploading files larger than 10 MB')
    ).toBeTruthy();
    expect(
      screen.getByText('Implement dark mode toggle on the settings page')
    ).toBeTruthy();
  });
});
