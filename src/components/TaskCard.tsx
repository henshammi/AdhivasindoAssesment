import { useState } from 'react';
import {
  IonAvatar,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonProgressBar,
} from '@ionic/react';
import {
  attachOutline,
  calendarClearOutline,
  checkboxOutline,
} from 'ionicons/icons';
import type { Assignee, LabelType, PriorityType, Task } from '../types';
import './TaskCard.css';

/* ------------------------------------------------------------
 * Pemetaan warna & helper kecil
 * ---------------------------------------------------------- */

/** Warna Ionic bagi setiap label task. */
const LABEL_COLORS: Record<LabelType, string> = {
  Feature: 'primary',
  Bug: 'danger',
  Issue: 'warning',
  Undefined: 'medium',
};

/** Warna Ionic bagi keutamaan (opsional) task. */
const PRIORITY_COLORS: Record<PriorityType, string> = {
  Low: 'medium',
  Medium: 'warning',
  High: 'danger',
};

/** Palet warna latar untuk avatar inisial. */
const AVATAR_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'danger',
];

/** Pilih warna avatar secara deterministik berdasarkan ID assignee. */
const avatarColorFor = (id: string): string => {
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? 'primary';
};

/** Dapatkan inisial nama, cth: "Rizky Pratama" -> "RP". */
const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Singkatan bulan untuk paparan tarikh pendek. */
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Format tarikh ISO ("2026-09-30") kepada bentuk pendek "30 Sep".
 * Pemformatan dilakukan secara manual bagi mengelakkan anjakan
 * zon waktu pada rentetan "YYYY-MM-DD".
 */
const formatDueDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  const monthName = month >= 1 && month <= 12 ? MONTHS_SHORT[month - 1] : '';
  return monthName ? `${day} ${monthName}` : isoDate;
};

/** Tentukan sama ada tarikh akhir sudah lepas (overdue). */
const isOverdue = (isoDate: string): boolean => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return false;
  }
  const dueDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate.getTime() < today.getTime();
};

/* ------------------------------------------------------------
 * Avatar assignee — gambar jika ada, inisial berwarna jika tiada
 * ---------------------------------------------------------- */

interface AssigneeAvatarProps {
  assignee: Assignee;
}

const AssigneeAvatar: React.FC<AssigneeAvatarProps> = ({ assignee }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(assignee.avatar) && !imageFailed;
  const color = avatarColorFor(assignee.id);

  return (
    <IonAvatar className="task-card__avatar" aria-label={assignee.name}>
      {showImage ? (
        <img
          src={assignee.avatar}
          alt={assignee.name}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="task-card__avatar-initials"
          style={{
            background: `var(--ion-color-${color})`,
            color: `var(--ion-color-${color}-contrast)`,
          }}
        >
          {getInitials(assignee.name)}
        </span>
      )}
    </IonAvatar>
  );
};

/* ------------------------------------------------------------
 * TaskCard — visual card task pada board.
 * Keadaan drag dikawal oleh wrapper Draggable di Board.
 * ---------------------------------------------------------- */

interface TaskCardProps {
  task: Task;
  /** true semasa card sedang ditarik (drag) — bayang lebih jelas. */
  isDragging?: boolean;
  /** Klik card — membuka modal Edit (TaskModal) di parent. */
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging = false,
  onClick,
}) => {
  const completedSubtasks = task.subtasks.filter(
    (subtask) => subtask.completed
  ).length;
  const totalSubtasks = task.subtasks.length;
  const progress = totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0;

  return (
    <IonCard
      className={`task-card${isDragging ? ' task-card--dragging' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        // Aksesibiliti: card boleh diaktifkan dengan kekunci Enter.
        if (onClick && event.key === 'Enter') {
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Poin bonus: gambar muka depan card (jika ditetapkan) */}
      {task.coverImage && (
        <img
          src={task.coverImage}
          alt={`Cover: ${task.title}`}
          className="task-card__cover"
        />
      )}

      <IonCardHeader className="task-card__header">
        <div className="task-card__badges">
          <IonBadge color={LABEL_COLORS[task.label]}>{task.label}</IonBadge>
          {task.priority && (
            <IonBadge color={PRIORITY_COLORS[task.priority]}>
              {task.priority}
            </IonBadge>
          )}
        </div>
        <IonCardTitle className="task-card__title">{task.title}</IonCardTitle>
      </IonCardHeader>

      <IonCardContent className="task-card__content">
        {/* Baris meta: due date, progress checklist, bilangan attachment */}
        <div className="task-card__row">
          <span
            className={`task-card__meta-item task-card__due${
              isOverdue(task.dueDate) ? ' task-card__due--overdue' : ''
            }`}
          >
            <IonIcon icon={calendarClearOutline} aria-hidden="true" />
            {formatDueDate(task.dueDate)}
          </span>

          {totalSubtasks > 0 && (
            <span className="task-card__meta-item task-card__checklist">
              <IonIcon icon={checkboxOutline} aria-hidden="true" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {task.attachments.length > 0 && (
            <span className="task-card__meta-item task-card__attachments">
              <IonIcon icon={attachOutline} aria-hidden="true" />
              {task.attachments.length}
            </span>
          )}
        </div>

        {/* Progress bar automatik daripada subtask yang selesai */}
        {totalSubtasks > 0 && (
          <IonProgressBar
            className="task-card__progress"
            color={completedSubtasks === totalSubtasks ? 'success' : 'primary'}
            value={progress}
          />
        )}

        {/* Senarai assignee dengan avatar bertindih */}
        {task.assignees.length > 0 && (
          <div className="task-card__assignees">
            {task.assignees.map((assignee) => (
              <AssigneeAvatar key={assignee.id} assignee={assignee} />
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default TaskCard;
