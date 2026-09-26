import { useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import Board from '../components/Board';
import TaskModal from '../components/TaskModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialAssignees, initialTasks } from '../utils/dummyData';
import { filterTasks } from '../utils/filters';
import type { DueFilter } from '../utils/filters';
import type { ColumnId, LabelType, Task } from '../types';
import './Home.css';

/** Label options for the board filter (per the types definition). */
const LABEL_FILTER_OPTIONS: LabelType[] = [
  'Feature',
  'Bug',
  'Issue',
  'Undefined',
];

/** Toast color per CRUD action type: Create=green, Update=blue, Delete=red. */
type ToastColor = 'success' | 'primary' | 'danger';

/**
 * Home — owner of the app's main state.
 * The tasks state is lifted up here so that CRUD
 * (Create / Update / Delete) and drag & drop share
 * the same source of data, persisted to LocalStorage.
 */
const Home: React.FC = () => {
  // Tasks state persisted to LocalStorage under the key 'kanban-tasks'.
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    'kanban-tasks',
    initialTasks
  );

  // ----- Modal control (CRUD) -----
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** `null` = Create mode; a Task object = Edit mode. */
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  /** Default column while in Create mode (from the "+" button). */
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>('todo');

  // ----- Toast notifications after CRUD actions (bonus point) -----
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** Current toast color — set together with the message based on the action type. */
  const [toastColor, setToastColor] = useState<ToastColor>('success');
  const showToast = (message: string, color: ToastColor) => {
    setToastMessage(message);
    setToastColor(color);
  };

  // ----- Stage 6: Task filtering & search -----
  /** Title search text from the IonSearchbar ('' = no search). */
  const [searchQuery, setSearchQuery] = useState('');
  /** Label filter; 'all' = all labels. */
  const [labelFilter, setLabelFilter] = useState<'all' | LabelType>('all');
  /** Assignee filter by ID; 'all' = all assignees. */
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  /** Due date filter ('all' = all dates). */
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');

  /**
   * The filtered task list — only tasks matching the active
   * search & filters are passed to the Board to be displayed.
   */
  const filteredTasks = useMemo(
    () =>
      filterTasks(tasks, {
        query: searchQuery,
        label: labelFilter === 'all' ? null : labelFilter,
        assigneeId: assigneeFilter === 'all' ? null : assigneeFilter,
        due: dueFilter,
      }),
    [tasks, searchQuery, labelFilter, assigneeFilter, dueFilter]
  );

  /** true when any search/filter is active on the board. */
  const isFilterActive =
    searchQuery.trim() !== '' ||
    labelFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    dueFilter !== 'all';

  /** Reset all search & filters back to their default values. */
  const resetFilters = () => {
    setSearchQuery('');
    setLabelFilter('all');
    setAssigneeFilter('all');
    setDueFilter('all');
  };

  /** Open the modal in Create mode for a given column (board "+" button). */
  const handleOpenCreate = (columnId: ColumnId) => {
    setSelectedTask(null);
    setSelectedColumn(columnId);
    setIsModalOpen(true);
  };

  /** Open the modal in Edit mode when a task card is clicked. */
  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  /** Close the modal (X button / Cancel / backdrop). */
  const handleCloseModal = () => setIsModalOpen(false);

  /**
   * Save a task from the modal:
   * - Existing task (id found in the array) → Update.
   * - New task (empty id) → Create with an ID from `Date.now()`.
   */
  const handleSave = (task: Task) => {
    const isUpdate = tasks.some((existing) => existing.id === task.id);

    if (isUpdate) {
      setTasks((prev) =>
        prev.map((existing) => (existing.id === task.id ? task : existing))
      );
      showToast('Task updated successfully', 'primary');
    } else {
      const newTask: Task = { ...task, id: Date.now().toString() };
      setTasks((prev) => [...prev, newTask]);
      showToast('Task created successfully', 'success');
    }

    setIsModalOpen(false);
  };

  /** Delete a task from the board (Delete button in the Edit modal). */
  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((existing) => existing.id !== taskId));
    showToast('Task deleted successfully', 'danger');
    setIsModalOpen(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Task Management Board</IonTitle>
        </IonToolbar>

        {/* Stage 6: search tasks by title */}
        <IonToolbar className="home-toolbar--search">
          <IonSearchbar
            value={searchQuery}
            placeholder="Search tasks..."
            debounce={150}
            showClearButton="focus"
            aria-label="Search tasks by title"
            onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
          />
        </IonToolbar>

        {/* Stage 6: Label / Assignee / Due Date filters */}
        <IonToolbar className="home-toolbar--filters">
          <div className="filter-bar">
            <IonSelect
              className="filter-bar__select"
              label="Label"
              labelPlacement="stacked"
              interface="popover"
              cancelText="Cancel"
              value={labelFilter}
              onIonChange={(e) =>
                setLabelFilter((e.detail.value ?? 'all') as 'all' | LabelType)
              }
            >
              <IonSelectOption value="all">All Labels</IonSelectOption>
              {LABEL_FILTER_OPTIONS.map((label) => (
                <IonSelectOption key={label} value={label}>
                  {label}
                </IonSelectOption>
              ))}
            </IonSelect>

            <IonSelect
              className="filter-bar__select"
              label="Assignee"
              labelPlacement="stacked"
              interface="popover"
              cancelText="Cancel"
              value={assigneeFilter}
              onIonChange={(e) => setAssigneeFilter(e.detail.value ?? 'all')}
            >
              <IonSelectOption value="all">All Assignees</IonSelectOption>
              {initialAssignees.map((assignee) => (
                <IonSelectOption key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </IonSelectOption>
              ))}
            </IonSelect>

            <IonSelect
              className="filter-bar__select"
              label="Due Date"
              labelPlacement="stacked"
              interface="popover"
              cancelText="Cancel"
              value={dueFilter}
              onIonChange={(e) =>
                setDueFilter((e.detail.value ?? 'all') as DueFilter)
              }
            >
              <IonSelectOption value="all">All Due Dates</IonSelectOption>
              <IonSelectOption value="overdue">Overdue</IonSelectOption>
              <IonSelectOption value="today">Today</IonSelectOption>
              <IonSelectOption value="week">Next 7 Days</IonSelectOption>
            </IonSelect>

            {/* Reset all search & filters */}
            <IonButton
              className="filter-bar__reset"
              fill="clear"
              size="small"
              disabled={!isFilterActive}
              onClick={resetFilters}
            >
              <IonIcon slot="start" icon={refreshOutline} />
              Reset
            </IonButton>

            {/* Visible task count while a filter is active */}
            {isFilterActive && (
              <span className="filter-bar__count">
                {filteredTasks.length}/{tasks.length} tasks shown
              </span>
            )}
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Task Management Board</IonTitle>
          </IonToolbar>
        </IonHeader>

        <Board
          tasks={filteredTasks}
          setTasks={setTasks}
          onAddTask={handleOpenCreate}
          onOpenTask={handleOpenEdit}
        />
      </IonContent>

      {/* CRUD modal — rendered inside IonPage as required by Ionic React */}
      <TaskModal
        isOpen={isModalOpen}
        task={selectedTask}
        defaultColumn={selectedColumn}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Toast after each Create / Update / Delete action (bonus point) */}
      <IonToast
        isOpen={toastMessage !== null}
        message={toastMessage ?? undefined}
        onDidDismiss={() => setToastMessage(null)}
        duration={2000}
        position="top"
        color={toastColor}
      />
    </IonPage>
  );
};

export default Home;

