import { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import Board from '../components/Board';
import TaskModal from '../components/TaskModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialTasks } from '../utils/dummyData';
import type { ColumnId, Task } from '../types';
import './Home.css';

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
      showToast(`Task "${task.title}" dikemas kini`);
    } else {
      const newTask: Task = { ...task, id: Date.now().toString() };
      setTasks((prev) => [...prev, newTask]);
      showToast(`Task "${newTask.title}" ditambah`);
    }

    setIsModalOpen(false);
  };

  /** Padam task daripada board (butang Padam dalam modal Edit). */
  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((existing) => existing.id !== taskId));
    showToast('Task dipadam');
    setIsModalOpen(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Task Management Board</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Task Management Board</IonTitle>
          </IonToolbar>
        </IonHeader>

        <Board
          tasks={tasks}
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

