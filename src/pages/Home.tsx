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

/** Pilihan label untuk penapis board (mengikut definisi types). */
const LABEL_FILTER_OPTIONS: LabelType[] = [
  'Feature',
  'Bug',
  'Issue',
  'Undefined',
];

/**
 * Home — pemilik state utama aplikasi.
 * State tasks diangkat (lifted) ke sini supaya CRUD
 * (Create / Update / Delete) dan drag & drop berkongsi
 * satu punca data yang sama, dipersist ke LocalStorage.
 */
const Home: React.FC = () => {
  // State tasks dipersist ke LocalStorage di bawah kunci 'kanban-tasks'.
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    'kanban-tasks',
    initialTasks
  );

  // ----- Kawalan modal (CRUD) -----
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** `null` = mod Create; objek Task = mod Edit. */
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  /** Kolom lalai semasa mod Create (daripada butang "+"). */
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>('todo');

  // ----- Toast notifikasi selepas aksi CRUD (poin bonus) -----
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => setToastMessage(message);

  // ----- Tahap 6: Penapis & carian task -----
  /** Teks carian judul daripada IonSearchbar ('' = tiada carian). */
  const [searchQuery, setSearchQuery] = useState('');
  /** Penapis label; 'all' = semua label. */
  const [labelFilter, setLabelFilter] = useState<'all' | LabelType>('all');
  /** Penapis assignee mengikut ID; 'all' = semua assignee. */
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  /** Penapis tarikh akhir ('all' = semua tarikh). */
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');

  /**
   * Senarai task yang telah disaring — hanya task yang sepadan dengan
   * carian & penapis aktif dihantar ke Board untuk dipaparkan.
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

  /** true jika ada sebarang carian/penapis aktif pada board. */
  const isFilterActive =
    searchQuery.trim() !== '' ||
    labelFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    dueFilter !== 'all';

  /** Set semula semua carian & penapis kepada nilai lalai. */
  const resetFilters = () => {
    setSearchQuery('');
    setLabelFilter('all');
    setAssigneeFilter('all');
    setDueFilter('all');
  };

  /** Buka modal dalam mod Create untuk satu kolom (butang "+" board). */
  const handleOpenCreate = (columnId: ColumnId) => {
    setSelectedTask(null);
    setSelectedColumn(columnId);
    setIsModalOpen(true);
  };

  /** Buka modal dalam mod Edit apabila card task diklik. */
  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  /** Tutup modal (butang X / Batal / backdrop). */
  const handleCloseModal = () => setIsModalOpen(false);

  /**
   * Simpan task daripada modal:
   * - Task sedia ada (id wujud dalam array) → Update.
   * - Task baharu (id kosong) → Create dengan ID `Date.now()`.
   */
  const handleSave = (task: Task) => {
    const isUpdate = tasks.some((existing) => existing.id === task.id);

    if (isUpdate) {
      setTasks((prev) =>
        prev.map((existing) => (existing.id === task.id ? task : existing))
      );
      showToast('Task updated successfully');
    } else {
      const newTask: Task = { ...task, id: Date.now().toString() };
      setTasks((prev) => [...prev, newTask]);
      showToast('Task created successfully');
    }

    setIsModalOpen(false);
  };

  /** Padam task daripada board (butang Padam dalam modal Edit). */
  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((existing) => existing.id !== taskId));
    showToast('Task deleted successfully');
    setIsModalOpen(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Task Management Board</IonTitle>
        </IonToolbar>

        {/* Tahap 6: carian task mengikut judul */}
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

        {/* Tahap 6: penapis Label / Assignee / Tarikh Akhir */}
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

            {/* Set semula semua carian & penapis */}
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

            {/* Kiraan task terpapar semasa penapis aktif */}
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

      {/* Modal CRUD — dirender dalam IonPage seperti disyaratkan Ionic React */}
      <TaskModal
        isOpen={isModalOpen}
        task={selectedTask}
        defaultColumn={selectedColumn}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Toast selepas setiap aksi Create / Update / Delete (poin bonus) */}
      <IonToast
        isOpen={toastMessage !== null}
        message={toastMessage ?? undefined}
        onDidDismiss={() => setToastMessage(null)}
        duration={2000}
        position="top"
        color="dark"
      />
    </IonPage>
  );
};

export default Home;

