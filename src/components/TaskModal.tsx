import { useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  closeOutline,
  cloudUploadOutline,
  documentAttachOutline,
  trashOutline,
} from 'ionicons/icons';
import { initialAssignees } from '../utils/dummyData';
import { COLUMN_IDS, COLUMN_TITLES } from '../utils/columns';
import type { ColumnId, LabelType, PriorityType, Subtask, Task } from '../types';
import './TaskModal.css';

/** Task label options per the types definition. */
const LABEL_OPTIONS: LabelType[] = ['Feature', 'Bug', 'Issue', 'Undefined'];

/** Task priority level options (optional). */
const PRIORITY_OPTIONS: PriorityType[] = ['Low', 'Medium', 'High'];

/**
 * Dummy file names for the "Add Dummy File" button — they cycle
 * based on the number of existing attachments (no real file upload).
 */
const DUMMY_ATTACHMENT_NAMES = [
  'document.pdf',
  'image.png',
  'notes.txt',
  'report.docx',
];

/** Shape of the modal form's internal state. */
interface TaskFormState {
  title: string;
  description: string;
  columnId: ColumnId;
  label: LabelType;
  /** '' means no priority (the `priority` field is optional). */
  priority: '' | PriorityType;
  dueDate: string;
  /** Card cover image URL (bonus point) — '' means no image. */
  coverImage: string;
  /** Selected assignee IDs — mapped back to full objects on save. */
  assigneeIds: string[];
  subtasks: Subtask[];
  /** Attachment file names (dummy — no real upload). */
  attachments: string[];
}

/** Build an empty form for Create mode. */
const createEmptyForm = (defaultColumn: ColumnId): TaskFormState => ({
  title: '',
  description: '',
  columnId: defaultColumn,
  label: 'Undefined',
  priority: '',
  dueDate: '',
  coverImage: '',
  assigneeIds: [],
  subtasks: [],
  attachments: [],
});

interface TaskModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close the modal (X button, Cancel button, or backdrop). */
  onClose: () => void;
  /** Task being edited — `null` means Create mode. */
  task: Task | null;
  /** Default column while in Create mode (from the column header "+" button). */
  defaultColumn: ColumnId;
  /** Save the task — Create/Update is decided by the parent (Home). */
  onSave: (task: Task) => void;
  /** Delete the task — only used in Edit mode. */
  onDelete: (taskId: string) => void;
}

/**
 * TaskModal — task detail form for Create, Edit & Delete.
 * All edits are held in internal state and are only
 * submitted to the parent (Home) when the "Save" button is pressed.
 */
const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  defaultColumn,
  onSave,
  onDelete,
}) => {
  const [form, setForm] = useState<TaskFormState>(() =>
    createEmptyForm(defaultColumn)
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Sync the form every time the modal opens (Create or Edit mode).
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (task) {
      // Edit mode — pre-fill all fields from the existing task.
      setForm({
        title: task.title,
        description: task.description,
        columnId: task.columnId,
        label: task.label,
        priority: task.priority ?? '',
        dueDate: task.dueDate,
        coverImage: task.coverImage ?? '',
        assigneeIds: task.assignees.map((assignee) => assignee.id),
        subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
        attachments: [...task.attachments],
      });
    } else {
      // Create mode — empty form with the default column.
      setForm(createEmptyForm(defaultColumn));
    }

    setNewSubtaskTitle('');
  }, [isOpen, task, defaultColumn]);

  /** Update some form fields uniformly. */
  const patchForm = (patch: Partial<TaskFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  // Completed subtask count — shown in the checklist header.
  const completedCount = form.subtasks.filter(
    (subtask) => subtask.completed
  ).length;

  /** Add a new subtask to the checklist. */
  const handleAddSubtask = () => {
    const trimmedTitle = newSubtaskTitle.trim();
    if (!trimmedTitle) {
      return;
    }
    patchForm({
      subtasks: [
        ...form.subtasks,
        {
          id: `st-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          title: trimmedTitle,
          completed: false,
        },
      ],
    });
    setNewSubtaskTitle('');
  };

  /** Toggle the completed / pending status of a subtask. */
  const handleToggleSubtask = (subtaskId: string) => {
    patchForm({
      subtasks: form.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      ),
    });
  };

  /** Remove a subtask from the checklist. */
  const handleRemoveSubtask = (subtaskId: string) => {
    patchForm({
      subtasks: form.subtasks.filter((subtask) => subtask.id !== subtaskId),
    });
  };

  /**
   * Add a dummy file to the attachments list — simulates
   * "browse from device" without any real file upload.
   */
  const handleAddDummyFile = () => {
    const dummyName =
      DUMMY_ATTACHMENT_NAMES[
        form.attachments.length % DUMMY_ATTACHMENT_NAMES.length
      ];
    patchForm({ attachments: [...form.attachments, dummyName] });
  };

  /** Remove an attachment from the list (by index). */
  const handleRemoveAttachment = (index: number) => {
    patchForm({
      attachments: form.attachments.filter((_, i) => i !== index),
    });
  };

  /**
   * Submit the form — build the complete Task object.
   * `id: ''` in Create mode; Home will generate the real ID.
   */
  const handleSaveClick = () => {
    const savedTask: Task = {
      id: task?.id ?? '',
      title: form.title.trim(),
      description: form.description.trim(),
      columnId: form.columnId,
      label: form.label,
      priority: form.priority === '' ? undefined : form.priority,
      assignees: initialAssignees.filter((assignee) =>
        form.assigneeIds.includes(assignee.id)
      ),
      dueDate: form.dueDate,
      subtasks: form.subtasks,
      attachments: form.attachments,
      coverImage: form.coverImage.trim() || undefined,
    };

    onSave(savedTask);
  };

  /** Delete the task — only available in Edit mode. */
  const handleDeleteClick = () => {
    if (task) {
      onDelete(task.id);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="task-modal">
      <IonHeader className="task-modal__header">
        <IonToolbar>
          <IonTitle>{task ? 'Edit Task' : 'New Task'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} aria-label="Close modal">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="task-modal__content">
        <IonList inset className="task-modal__fields">
          {/* Task title */}
          <IonItem>
            <IonInput
              label="Task Title"
              labelPlacement="stacked"
              placeholder="Enter task title"
              value={form.title}
              onIonInput={(e) => patchForm({ title: e.detail.value ?? '' })}
              helperText={form.title.trim() ? undefined : 'Title is required'}
            />
          </IonItem>

          {/* Task description */}
          <IonItem>
            <IonTextarea
              label="Description"
              labelPlacement="stacked"
              placeholder="Detailed task description…"
              autoGrow
              rows={3}
              value={form.description}
              onIonInput={(e) =>
                patchForm({ description: e.detail.value ?? '' })
              }
            />
          </IonItem>

          {/* Bonus point: card cover image URL (optional) */}
          <IonItem>
            <IonInput
              className="task-modal__cover-input"
              label="Cover Image (URL)"
              labelPlacement="stacked"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={form.coverImage}
              onIonInput={(e) =>
                patchForm({ coverImage: e.detail.value ?? '' })
              }
              helperText="Optional — shown at the top of the task card"
            />
          </IonItem>

          {/* Status / board column */}
          <IonItem>
            <IonSelect
              label="Column"
              labelPlacement="stacked"
              interface="popover"
              value={form.columnId}
              onIonChange={(e) =>
                patchForm({ columnId: e.detail.value as ColumnId })
              }
            >
              {COLUMN_IDS.map((columnId) => (
                <IonSelectOption key={columnId} value={columnId}>
                  {COLUMN_TITLES[columnId]}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Category label */}
          <IonItem>
            <IonSelect
              label="Label"
              labelPlacement="stacked"
              interface="popover"
              value={form.label}
              onIonChange={(e) =>
                patchForm({ label: e.detail.value as LabelType })
              }
            >
              {LABEL_OPTIONS.map((label) => (
                <IonSelectOption key={label} value={label}>
                  {label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Priority (optional) */}
          <IonItem>
            <IonSelect
              label="Priority"
              labelPlacement="stacked"
              interface="popover"
              value={form.priority}
              onIonChange={(e) =>
                patchForm({ priority: e.detail.value as '' | PriorityType })
              }
            >
              <IonSelectOption value="">None</IonSelectOption>
              {PRIORITY_OPTIONS.map((priority) => (
                <IonSelectOption key={priority} value={priority}>
                  {priority}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Due date */}
          <IonItem>
            <IonInput
              label="Due Date"
              labelPlacement="stacked"
              type="date"
              value={form.dueDate}
              onIonInput={(e) => patchForm({ dueDate: e.detail.value ?? '' })}
            />
          </IonItem>

          {/* Assignees — options from the team list */}
          <IonItem>
            <IonSelect
              label="Assignee"
              labelPlacement="stacked"
              multiple
              value={form.assigneeIds}
              onIonChange={(e) =>
                patchForm({ assigneeIds: e.detail.value as string[] })
              }
            >
              {initialAssignees.map((assignee) => (
                <IonSelectOption key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonList>

        {/* ----- Checklist / Subtasks section ----- */}
        <div className="task-modal__checklist">
          <div className="task-modal__checklist-header">
            <h3>Checklist</h3>
            <span>
              {completedCount}/{form.subtasks.length} done
            </span>
          </div>

          {form.subtasks.length > 0 && (
            <IonList inset className="task-modal__subtasks">
              {form.subtasks.map((subtask) => (
                <IonItem key={subtask.id}>
                  <IonCheckbox
                    checked={subtask.completed}
                    justify="start"
                    onIonChange={() => handleToggleSubtask(subtask.id)}
                  >
                    {subtask.title}
                  </IonCheckbox>
                  <IonButton
                    slot="end"
                    fill="clear"
                    color="medium"
                    aria-label={`Remove subtask: ${subtask.title}`}
                    onClick={() => handleRemoveSubtask(subtask.id)}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}

          {/* Row to add a new subtask */}
          <div className="task-modal__add-subtask">
            <IonInput
              className="task-modal__add-subtask-input"
              placeholder="Add new subtask…"
              value={newSubtaskTitle}
              onIonInput={(e) => setNewSubtaskTitle(e.detail.value ?? '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubtask();
                }
              }}
            />
            <IonButton
              size="small"
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
            >
              <IonIcon slot="start" icon={addOutline} />
              Add
            </IonButton>
          </div>
        </div>

        {/* ----- Attachments section (dummy) ----- */}
        <div className="task-modal__attachments">
          <div className="task-modal__attachments-header">
            <h3>Attachments</h3>
            <IonButton size="small" fill="clear" onClick={handleAddDummyFile}>
              <IonIcon slot="start" icon={addOutline} />
              Add Dummy File
            </IonButton>
          </div>

          {/* Dummy drag & drop area — UI only, no real upload */}
          <div
            className="task-modal__dropzone"
            role="button"
            tabIndex={0}
            aria-label="Drag and drop files here or browse from device (demo)"
            onClick={handleAddDummyFile}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleAddDummyFile();
              }
            }}
          >
            <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
            <p className="task-modal__dropzone-text">
              Drag &amp; Drop files here or browse from device
            </p>
          </div>

          {/* File name list — only shown when there are attachments */}
          {form.attachments.length > 0 && (
            <IonList inset className="task-modal__attachment-list">
              {form.attachments.map((fileName, index) => (
                <IonItem key={`${fileName}-${index}`}>
                  <IonIcon
                    slot="start"
                    icon={documentAttachOutline}
                    aria-hidden="true"
                  />
                  <span className="task-modal__attachment-name">
                    {fileName}
                  </span>
                  <IonButton
                    slot="end"
                    fill="clear"
                    color="medium"
                    aria-label={`Remove attachment: ${fileName}`}
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>

      {/* Footer: Delete (Edit mode only) + Save */}
      <IonFooter className="task-modal__footer">
        <IonToolbar>
          <IonButtons slot="start">
            {task && (
              <IonButton color="danger" onClick={handleDeleteClick}>
                <IonIcon slot="start" icon={trashOutline} />
                Delete
              </IonButton>
            )}
          </IonButtons>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose}>
              Cancel
            </IonButton>
            <IonButton onClick={handleSaveClick} disabled={!form.title.trim()}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default TaskModal;