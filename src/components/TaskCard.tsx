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
 * Color mappings & small helpers
 * ---------------------------------------------------------- */

/** Ionic color for each task label. */
const LABEL_COLORS: Record<LabelType, string> = {
  Feature: 'primary',
  Bug: 'danger',
  Issue: 'warning',
  Undefined: 'medium',
};

/** Ionic color for the task priority (optional). */
const PRIORITY_COLORS: Record<PriorityType, string> = {
  Low: 'medium',
  Medium: 'warning',
  High: 'danger',
};

/** Background color palette for initials avatars. */
const AVATAR_COLORS = [
  'primary',
  'secondary',
  'tertiary',
  'success',
  'warning',
  'danger',
];

/** Pick the avatar color deterministically based on the assignee ID. */
const avatarColorFor = (id: string): string => {
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? 'primary';
};

/** Get name initials, e.g. "Rizky Pratama" -> "RP". */
const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Month abbreviations for the short date display. */
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
 * Format an ISO date ("2026-09-30") into the short form "30 Sep".
 * The formatting is done manually to avoid timezone
 * shifts on "YYYY-MM-DD" strings.
 */
const formatDueDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return isoDate;
  }
  const monthName = month >= 1 && month <= 12 ? MONTHS_SHORT[month - 1] : '';
  return monthName ? `${day} ${monthName}` : isoDate;
};

/** Determine whether the due date is in the past (overdue). */
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
 * Assignee avatar — picture if available, colored initials otherwise
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
 * TaskCard — the visual task card on the board.
 * The drag state is controlled by the Draggable wrapper in Board.
 * ---------------------------------------------------------- */

interface TaskCardProps {
  task: Task;
  /** true while the card is being dragged — clearer shadow. */
  isDragging?: boolean;
  /** Card click — opens the Edit modal (TaskModal) in the parent. */
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
        // Accessibility: the card can be activated with the Enter key.
        if (onClick && event.key === 'Enter') {
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Bonus point: card cover image (when set) — rendered at the
          very top of the card, before the header */}
      {task.coverImage && (
        <img
          src={task.coverImage}
          alt={`Cover: ${task.title}`}
          className="task-card__cover"
          draggable={false}
          loading="lazy"
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
        {/* Meta row: due date, checklist progress, attachment count */}
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

        {/* Progress bar computed automatically from completed subtasks */}
        {totalSubtasks > 0 && (
          <IonProgressBar
            className="task-card__progress"
            color={completedSubtasks === totalSubtasks ? 'success' : 'primary'}
            value={progress}
          />
        )}

        {/* Assignee list with overlapping avatars */}
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
