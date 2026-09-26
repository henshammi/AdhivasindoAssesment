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

/** Pilihan label task mengikut definisi types. */
const LABEL_OPTIONS: LabelType[] = ['Feature', 'Bug', 'Issue', 'Undefined'];

/** Pilihan tahap keutamaan task (opsional). */
const PRIORITY_OPTIONS: PriorityType[] = ['Low', 'Medium', 'High'];

/**
 * Nama fail dummy untuk butang "Add Dummy File" — berkitar mengikut
 * bilangan lampiran sedia ada (tiada muat naik fail sebenar).
 */
const DUMMY_ATTACHMENT_NAMES = [
  'document.pdf',
  'image.png',
  'notes.txt',
  'report.docx',
];

/** Bentuk state dalaman borang modal. */
interface TaskFormState {
  title: string;
  description: string;
  columnId: ColumnId;
  label: LabelType;
  /** '' bermaksud tiada keutamaan (field `priority` adalah opsional). */
  priority: '' | PriorityType;
  dueDate: string;
  /** URL imej muka depan card (poin bonus) — '' bermaksud tiada imej. */
  coverImage: string;
  /** ID assignee terpilih — dipetakan semula ke objek penuh semasa simpan. */
  assigneeIds: string[];
  subtasks: Subtask[];
  /** Nama fail lampiran (dummy — tiada muat naik sebenar). */
  attachments: string[];
}

/** Bina borang kosong untuk mod Create. */
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
  /** Modal terbuka atau tidak. */
  isOpen: boolean;
  /** Tutup modal (butang X, butang Batal, atau backdrop). */
  onClose: () => void;
  /** Task yang sedang diedit — `null` bermaksud mod Create. */
  task: Task | null;
  /** Kolom lalai semasa mod Create (daripada butang "+" header kolom). */
  defaultColumn: ColumnId;
  /** Simpan task — Create/Update diputuskan oleh parent (Home). */
  onSave: (task: Task) => void;
  /** Padam task — hanya digunakan dalam mod Edit. */
  onDelete: (taskId: string) => void;
}

/**
 * TaskModal — borang detail task untuk Create, Edit & Delete.
 * Semua suntingan dipegang dalam state dalaman dan hanya
 * dihantar ke parent (Home) apabila butang "Simpan" ditekan.
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

  // Segerak borang setiap kali modal dibuka (mod Create atau mod Edit).
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (task) {
      // Mod Edit — praisi semua field daripada task sedia ada.
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
      // Mod Create — borang kosong dengan kolom lalai.
      setForm(createEmptyForm(defaultColumn));
    }

    setNewSubtaskTitle('');
  }, [isOpen, task, defaultColumn]);

  /** Kemas kini sebahagian field borang secara seragam. */
  const patchForm = (patch: Partial<TaskFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  // Kiraan subtask selesai — dipapar pada header checklist.
  const completedCount = form.subtasks.filter(
    (subtask) => subtask.completed
  ).length;

  /** Tambah subtask baharu ke dalam senarai semak. */
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

  /** Togol status selesai / belum selesai bagi satu subtask. */
  const handleToggleSubtask = (subtaskId: string) => {
    patchForm({
      subtasks: form.subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      ),
    });
  };

  /** Buang satu subtask daripada senarai semak. */
  const handleRemoveSubtask = (subtaskId: string) => {
    patchForm({
      subtasks: form.subtasks.filter((subtask) => subtask.id !== subtaskId),
    });
  };

  /**
   * Tambah satu fail dummy ke dalam senarai lampiran — simulasi
   * "browse from device" tanpa muat naik fail sebenar.
   */
  const handleAddDummyFile = () => {
    const dummyName =
      DUMMY_ATTACHMENT_NAMES[
        form.attachments.length % DUMMY_ATTACHMENT_NAMES.length
      ];
    patchForm({ attachments: [...form.attachments, dummyName] });
  };

  /** Buang satu lampiran daripada senarai (mengikut indeks). */
  const handleRemoveAttachment = (index: number) => {
    patchForm({
      attachments: form.attachments.filter((_, i) => i !== index),
    });
  };

  /**
   * Hantar borang — bina objek Task yang lengkap.
   * `id: ''` dalam mod Create; Home akan menjana ID sebenar.
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

  /** Padam task — hanya tersedia dalam mod Edit. */
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
          {/* Judul task */}
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

          {/* Deskripsi task */}
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

          {/* Poin bonus: URL imej muka depan card (opsional) */}
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

          {/* Status / kolom board */}
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

          {/* Label kategori */}
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

          {/* Prioriti (opsional) */}
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

          {/* Tarikh akhir (due date) */}
          <IonItem>
            <IonInput
              label="Due Date"
              labelPlacement="stacked"
              type="date"
              value={form.dueDate}
              onIonInput={(e) => patchForm({ dueDate: e.detail.value ?? '' })}
            />
          </IonItem>

          {/* Assignees — pilihan daripada senarai pasukan */}
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

        {/* ----- Bahagian Checklist / Subtasks ----- */}
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

          {/* Baris tambah subtask baharu */}
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

        {/* ----- Bahagian Lampiran (dummy) ----- */}
        <div className="task-modal__attachments">
          <div className="task-modal__attachments-header">
            <h3>Attachments</h3>
            <IonButton size="small" fill="clear" onClick={handleAddDummyFile}>
              <IonIcon slot="start" icon={addOutline} />
              Add Dummy File
            </IonButton>
          </div>

          {/* Area dummy drag & drop — hanya UI, tiada muat naik sebenar */}
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

          {/* Senarai nama fail — hanya dipapar jika ada lampiran */}
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

      {/* Footer: Padam (mod Edit sahaja) + Simpan */}
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