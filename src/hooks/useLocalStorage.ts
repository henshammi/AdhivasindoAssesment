import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/** Fungsi setter yang dikembalikan oleh `useLocalStorage`. */
export type SetLocalStorageValue<T> = Dispatch<SetStateAction<T>>;

/**
 * ============================================================
 *  useLocalStorage — Custom Hook Generik
 * ------------------------------------------------------------
 *  Menyegerakkan sebahagian state React dengan `window.localStorage`.
 *
 *  Ciri-ciri:
 *  - Generik `<T>` — boleh digunakan untuk sebarang bentuk data.
 *  - Nilai awal dibaca secara "lazy" (satu kali sahaja semasa render pertama).
 *  - Ralat `JSON.parse` / `setItem` ditangkap dengan selamat — data rosak
 *    akan memulangkan semula `initialValue`, aplikasi tidak akan crash.
 *  - Sebarang perubahan state akan ditulis semula ke localStorage
 *    secara automatik melalui `useEffect`.
 *
 *  Contoh penggunaan:
 *  ```ts
 *  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
 *  setTasks((prev) => [...prev, newTask]);
 *  ```
 * ============================================================
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetLocalStorageValue<T>] {
  /**
   * Baca nilai awal secara "lazy" — hanya dilaksanakan sekali.
   * Jika data di localStorage rosak (invalid JSON), amaran diberikan
   * dan `initialValue` digunakan sebagai gantinya.
   */
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item === null ? initialValue : (JSON.parse(item) as T);
    } catch (error) {
      console.warn(
        `useLocalStorage: Gagal membaca "${key}" dari localStorage. Data rosak akan diabaikan.`,
        error
      );
      return initialValue;
    }
  });

  /**
   * Auto-persist: setiap kali `key` atau `value` berubah,
   * nilai baharu akan ditulis ke localStorage.
   * `JSON.stringify` juga boleh gagal (cth: kuota penuh / private mode),
   * oleh itu dibalut dengan try/catch.
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(
        `useLocalStorage: Gagal menyimpan "${key}" ke localStorage.`,
        error
      );
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
