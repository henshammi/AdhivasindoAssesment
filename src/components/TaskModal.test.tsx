import { fireEvent, render, screen, act } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TaskModal from './TaskModal';
import { initialTasks } from '../utils/dummyData';
import type { ColumnId, Task } from '../types';

/**
 * IonModal (@ionic/react — createInlineOverlayComponent) memaparkan
 * kandungan melalui portal ke document.body dan hanya mount children
 * selepas acara ionMount/willPresent dipancarkan oleh Stencil.
 * Flush ini memberi masa kepada present() + React mount children.
 */
const flushModalUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
};

/**
 * Render modal dahulu dalam keadaan tertutup, kemudian buka semula —
 * meniru aliran sebenar (modal dibuka selepas mount) supaya present()
 * berjalan pada elemen yang sudah bersambung dengan document.body.
 */
const renderOpenModal = async (
  task: Task | null,
  defaultColumn: ColumnId,
  callbacks: {
    onClose: () => void;
    onSave: (task: Task) => void;
    onDelete: (taskId: string) => void;
  }
) => {
  const props = { task, defaultColumn, ...callbacks };
  const utils = render(<TaskModal {...props} isOpen={false} />);
  utils.rerender(<TaskModal {...props} isOpen={true} />);
  await flushModalUpdates();
  return utils;
};

describe('TaskModal', () => {
  test('mod Create: butang Simpan menghantar task baharu (id kosong) dengan kolom lalai', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'doing', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // Kandungan modal berada dalam portal document.body.
    const titleInput = document.querySelector('ion-input');
    expect(titleInput).not.toBeNull();
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'Task ujian baharu' } })
    );

    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.title).toBe('Task ujian baharu');
    // id kosong → Home akan menjana ID baharu (mod Create)
    expect(savedTask.id).toBe('');
    // Kolom lalai diwarisi daripada prop defaultColumn
    expect(savedTask.columnId).toBe('doing');
    // Mod Create tanpa URL imej muka → coverImage kekal undefined
    expect(savedTask.coverImage).toBeUndefined();
  });

  test('mod Edit: papar data task sedia ada; butang Padam memanggil onDelete', async () => {
    const onDelete = vi.fn();
    const task = initialTasks[0];
    await renderOpenModal(task, 'todo', {
      onClose: vi.fn(),
      onSave: vi.fn(),
      onDelete,
    });

    // Judul task sedia ada dipaparkan pada input pertama.
    const titleInput =
      document.querySelector('ion-input') as HTMLIonInputElement;
    expect(titleInput.value).toBe(task.title);

    // Butang Padam hanya wujud dalam mod Edit.
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(task.id);
  });

  test('checklist: subtask baharu ditambah melalui input + butang Tambah', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'todo', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // Isi input subtask dalam bahagian checklist, kemudian tekan Tambah.
    const subtaskInput = document.querySelector(
      '.task-modal__add-subtask ion-input'
    );
    await fireEvent(
      subtaskInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'Subtask ujian' } })
    );
    fireEvent.click(screen.getByText('Add'));

    // Isi judul supaya butang Simpan aktif, kemudian simpan.
    const titleInput = document.querySelector('ion-input');
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', {
        detail: { value: 'Task dengan checklist' },
      })
    );
    fireEvent.click(screen.getByText('Save'));

    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.subtasks).toHaveLength(1);
    expect(savedTask.subtasks[0]?.title).toBe('Subtask ujian');
    expect(savedTask.subtasks[0]?.completed).toBe(false);
  });

  test('poin bonus: URL imej muka diisi & dihantar bersama task semasa Simpan', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'todo', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // Isi judul supaya butang Simpan aktif.
    const titleInput = document.querySelector('ion-input');
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'Task dengan imej' } })
    );

    // Isi URL imej muka depan pada input khas (nilai ditrim semasa simpan).
    const coverInput = document.querySelector(
      'ion-input.task-modal__cover-input'
    );
    expect(coverInput).not.toBeNull();
    await fireEvent(
      coverInput as Element,
      new CustomEvent('ionInput', {
        detail: { value: '  https://contoh.com/imej.jpg  ' },
      })
    );

    fireEvent.click(screen.getByText('Save'));

    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.title).toBe('Task dengan imej');
    expect(savedTask.coverImage).toBe('https://contoh.com/imej.jpg');
  });
});

