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

  test('bonus point: Add Cover Image generates a random cover & Remove clears it', async () => {
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

    // No cover yet — only the "Add Cover Image" area is rendered.
    expect(
      document.querySelector('.task-modal__cover-preview-img')
    ).toBeNull();

    // One click generates a random dummy cover URL (no manual typing).
    fireEvent.click(screen.getByText('Add Cover Image'));

    // A small preview of the generated cover appears in the modal.
    const preview = document.querySelector<HTMLImageElement>(
      '.task-modal__cover-preview-img'
    );
    expect(preview).not.toBeNull();
    expect(preview?.getAttribute('src')).toMatch(
      /^https:\/\/picsum\.photos\/seed\/.+\/400\/200$/
    );

    // Save — the generated cover is submitted with the task.
    fireEvent.click(screen.getByText('Save'));
    const savedTask = (onSave.mock.calls[0] as unknown as Task[])[0];
    expect(savedTask.title).toBe('Task with image');
    expect(savedTask.coverImage).toMatch(
      /^https:\/\/picsum\.photos\/seed\/.+\/400\/200$/
    );

    // Remove — the cover state is cleared and saving omits the cover.
    fireEvent.click(screen.getByText('Remove'));
    expect(
      document.querySelector('.task-modal__cover-preview-img')
    ).toBeNull();

    fireEvent.click(screen.getByText('Save'));
    const secondSavedTask = (onSave.mock.calls[1] as unknown as Task[])[0];
    expect(secondSavedTask.coverImage).toBeUndefined();
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

