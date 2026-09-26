import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/** Setter function returned by `useLocalStorage`. */
export type SetLocalStorageValue<T> = Dispatch<SetStateAction<T>>;

/**
 * ============================================================
 *  useLocalStorage — Generic Custom Hook
 * ------------------------------------------------------------
 *  Keeps a piece of React state in sync with `window.localStorage`.
 *
 *  Features:
 *  - Generic `<T>` — works with any data shape.
 *  - The initial value is read "lazily" (only once during the first render).
 *  - `JSON.parse` / `setItem` errors are caught safely — corrupted
 *    data falls back to `initialValue`, so the app never crashes.
 *  - Every state change is written back to localStorage
 *    automatically through `useEffect`.
 *
 *  Usage example:
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
   * Read the initial value "lazily" — executed only once.
   * If the data in localStorage is corrupted (invalid JSON), a warning
   * is logged and `initialValue` is used instead.
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
        `useLocalStorage: Failed to read "${key}" from localStorage. Corrupted data will be ignored.`,
        error
      );
      return initialValue;
    }
  });

  /**
   * Auto-persist: every time `key` or `value` changes,
   * the new value is written to localStorage.
   * `JSON.stringify` can also fail (e.g. quota exceeded / private mode),
   * so it is wrapped in a try/catch.
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(
        `useLocalStorage: Failed to save "${key}" to localStorage.`,
        error
      );
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
