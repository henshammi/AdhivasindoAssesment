import { fireEvent, render, screen, act } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import TaskModal from './TaskModal';
import { initialTasks } from '../utils/dummyData';
import type { ColumnId, Task } from '../types';

/**
 * IonModal (@ionic/react — createInlineOverlayComponent) renders
 * its content through a portal into document.body and only mounts
 * children after the ionMount/willPresent event is emitted by Stencil.
 * This flush gives present() + React time to mount the children.
 */
const flushModalUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
};

/**
 * Render the modal closed first, then open it — mimicking the
 * real flow (the modal opens after mount) so that present()
 * runs on an element already connected to document.body.
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
  test('Create mode: Save button submits a new task (empty id) with the default column', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'doing', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // The modal content lives in the document.body portal.
    const titleInput = document.querySelector('ion-input');
    expect(titleInput).not.toBeNull();
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'New test task' } })
    );

    fireEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.title).toBe('New test task');
    // Empty id → Home will generate a new id (Create mode)
    expect(savedTask.id).toBe('');
    // The default column is inherited from the defaultColumn prop
    expect(savedTask.columnId).toBe('doing');
    // Create mode without a cover URL → coverImage stays undefined
    expect(savedTask.coverImage).toBeUndefined();
  });

  test('Edit mode: shows existing task data; Delete button calls onDelete', async () => {
    const onDelete = vi.fn();
    const task = initialTasks[0];
    await renderOpenModal(task, 'todo', {
      onClose: vi.fn(),
      onSave: vi.fn(),
      onDelete,
    });

    // The existing task title is shown in the first input.
    const titleInput =
      document.querySelector('ion-input') as HTMLIonInputElement;
    expect(titleInput.value).toBe(task.title);

    // The Delete button only exists in Edit mode.
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(task.id);
  });

  test('checklist: a new subtask is added via the input + Add button', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'todo', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // Fill the subtask input in the checklist section, then press Add.
    const subtaskInput = document.querySelector(
      '.task-modal__add-subtask ion-input'
    );
    await fireEvent(
      subtaskInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'Test subtask' } })
    );
    fireEvent.click(screen.getByText('Add'));

    // Fill the title so the Save button is enabled, then save.
    const titleInput = document.querySelector('ion-input');
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', {
        detail: { value: 'Task with checklist' },
      })
    );
    fireEvent.click(screen.getByText('Save'));

    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.subtasks).toHaveLength(1);
    expect(savedTask.subtasks[0]?.title).toBe('Test subtask');
    expect(savedTask.subtasks[0]?.completed).toBe(false);
  });

  test('bonus point: cover image URL is filled in & submitted with the task on Save', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'todo', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // Fill the title so the Save button is enabled.
    const titleInput = document.querySelector('ion-input');
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', { detail: { value: 'Task with image' } })
    );

    // Fill the cover image URL in the dedicated input (the value is trimmed on save).
    const coverInput = document.querySelector(
      'ion-input.task-modal__cover-input'
    );
    expect(coverInput).not.toBeNull();
    await fireEvent(
      coverInput as Element,
      new CustomEvent('ionInput', {
        detail: { value: '  https://example.com/image.jpg  ' },
      })
    );

    fireEvent.click(screen.getByText('Save'));

    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.title).toBe('Task with image');
    expect(savedTask.coverImage).toBe('https://example.com/image.jpg');
  });

  test('dummy attachments: Add Dummy File button adds file names & saves them with the task', async () => {
    const onSave = vi.fn();
    await renderOpenModal(null, 'todo', {
      onClose: vi.fn(),
      onSave,
      onDelete: vi.fn(),
    });

    // The dummy dropzone area is rendered (UI only).
    expect(
      screen.getByText('Drag & Drop files here or browse from device')
    ).toBeTruthy();

    // Add two dummy files via the Add Dummy File button.
    fireEvent.click(screen.getByText('Add Dummy File'));
    fireEvent.click(screen.getByText('Add Dummy File'));

    // Fill the title so the Save button is enabled, then save.
    const titleInput = document.querySelector('ion-input');
    await fireEvent(
      titleInput as Element,
      new CustomEvent('ionInput', {
        detail: { value: 'Task with attachments' },
      })
    );
    fireEvent.click(screen.getByText('Save'));

    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.attachments).toHaveLength(2);
    expect(savedTask.attachments[0]).toBe('document.pdf');
    expect(savedTask.attachments[1]).toBe('image.png');
  });
});

