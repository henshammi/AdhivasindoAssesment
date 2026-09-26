import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { IonButton, IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import TaskCard from './TaskCard';
import { COLUMN_IDS, COLUMN_TITLES } from '../utils/columns';
import type { Dispatch, SetStateAction } from 'react';
import type { ColumnId, Task } from '../types';
import './Board.css';

/** Props Board — kini terkawal (controlled) oleh Home. */
interface BoardProps {
  /** Senarai penuh task (punca state: Home → useLocalStorage). */
  tasks: Task[];
  /** Setter state tasks — digunakan oleh handler drag & drop. */
  setTasks: Dispatch<SetStateAction<Task[]>>;
  /** Buka modal Create untuk satu kolom (butang "+" header kolom). */
  onAddTask: (columnId: ColumnId) => void;
  /** Buka modal Edit apabila card task diklik. */
  onOpenTask: (task: Task) => void;
}

/** Type guard — sahkan nilai droppableId ialah ID kolom yang sah. */
const isColumnId = (value: string): value is ColumnId =>
  (COLUMN_IDS as string[]).includes(value);

/**
 * Alihkan satu task ke kedudukan baharu pada senarai rata tasks.
 * - Dipanggil oleh `handleDragEnd` selepas semua pengesahan dilakukan.
 * - `columnId` task ditukar kepada kolom destinasi.
 * - `destinationIndex` merujuk susunan TERPAPAR bagi kolom destinasi
 *   (selepas penapis), jadi ia dipetakan kepada task jiran ("anchor")
 *   dalam senarai penuh — drag & drop kekal tepat walaupun penapis
 *   aktif menyembunyikan sebahagian task.
 */
const moveTask = (
  tasks: Task[],
  taskId: string,
  destinationColumnId: ColumnId,
  destinationIndex: number,
  /** Task kolom destinasi yang terpapar, tanpa card yang sedang diheret. */
  visibleDestinationTasks: Task[]
): Task[] => {
  const draggedTask = tasks.find((task) => task.id === taskId);
  if (!draggedTask) {
    return tasks;
  }

  const withoutDragged = tasks.filter((task) => task.id !== taskId);
  const movedTask: Task = {
    ...draggedTask,
    columnId: destinationColumnId,
  };

  // (i) Sisip sebelum task jiran ("anchor") pada kedudukan destinasi.
  //     Index destinasi merujuk susunan terpapar; anchor ialah task
  //     terpapar pada kedudukan itu (tiada anchor = hujung kolom).
  const anchorTask = visibleDestinationTasks[destinationIndex];
  if (anchorTask) {
    const anchorPosition = withoutDragged.findIndex(
      (task) => task.id === anchorTask.id
    );
    if (anchorPosition !== -1) {
      const nextTasks = [...withoutDragged];
      nextTasks.splice(anchorPosition, 0, movedTask);
      return nextTasks;
    }
  }

  // (ii) Tiada anchor — letak di hujung kolom destinasi, iaitu sebelum
  //      task pertama kolom-kolom seterusnya mengikut susunan board.
  const destinationOrder = COLUMN_IDS.indexOf(destinationColumnId);
  const firstFollowingTask = withoutDragged.find(
    (task) => COLUMN_IDS.indexOf(task.columnId) > destinationOrder
  );
  if (firstFollowingTask) {
    const insertPosition = withoutDragged.findIndex(
      (task) => task.id === firstFollowingTask.id
    );
    const nextTasks = [...withoutDragged];
    nextTasks.splice(insertPosition, 0, movedTask);
    return nextTasks;
  }

  // (iii) Kolom destinasi ialah kolom terakhir — tambah pada hujung senarai.
  return [...withoutDragged, movedTask];
};

/**
 * Board — layout kanban 5 kolom dengan drag & drop antar kolom.
 * Board kini terkawal (controlled) oleh Home: state tasks dan
 * tindakan CRUD (modal) dinaikkan (lifted) ke parent melalui props.
 */
const Board: React.FC<BoardProps> = ({
  tasks,
  setTasks,
  onAddTask,
  onOpenTask,
}) => {

  /**
   * Handler drag & drop — dipanggil oleh DragDropContext selepas
   * sebarang drag selesai ATAU dibatalkan.
   */
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // (a) Card di-drop di luar sebarang kolom (tiada destinasi) — batalkan.
    if (!destination) {
      return;
    }

    // (b) Kedudukan tidak berubah (kolom & index sama) — batalkan.
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // (c) Sahkan kedua-dua ID kolom adalah sah (droppableId === ColumnId).
    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;
    if (!isColumnId(sourceColumnId) || !isColumnId(destinationColumnId)) {
      return;
    }

    // (d) Senarai task yang TERPAPAR bagi kolom destinasi (tanpa card yang
    //     sedang diheret). Index destinasi dnd merujuk susunan terpapar;
    //     apabila penapis aktif, ia hanya sebahagian daripada senarai penuh.
    const visibleDestinationTasks = tasks.filter(
      (task) =>
        task.columnId === destinationColumnId && task.id !== draggableId
    );

    // Kemaskini state — LocalStorage ditulis automatik oleh useLocalStorage.
    setTasks((prevTasks) =>
      moveTask(
        prevTasks,
        draggableId,
        destinationColumnId,
        destination.index,
        visibleDestinationTasks
      )
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="board">
        {COLUMN_IDS.map((columnId) => {
          // Tapis task mengikut kolom semasa
          const columnTasks = tasks.filter(
            (task) => task.columnId === columnId
          );

          return (
            <section
              className="board__column"
              key={columnId}
              aria-label={COLUMN_TITLES[columnId]}
            >
              <header className="board__column-header">
                <h2 className="board__column-title">
                  {COLUMN_TITLES[columnId]}
                  <span className="board__column-count">
                    {columnTasks.length}
                  </span>
                </h2>

                {/* Buka modal Create Task untuk kolom ini */}
                <IonButton
                  className="board__add-button"
                  fill="clear"
                  size="small"
                  aria-label={`Add new task to ${COLUMN_TITLES[columnId]} column`}
                  onClick={() => onAddTask(columnId)}
                >
                  <IonIcon slot="icon-only" icon={addOutline} />
                </IonButton>
              </header>

              {/* Area senarai task — droppable bagi setiap kolom */}
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`board__column-body${
                      snapshot.isDraggingOver
                        ? ' board__column-body--drag-over'
                        : ''
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="board__task-wrapper"
                          >
                            <TaskCard
                              task={task}
                              isDragging={dragSnapshot.isDragging}
                              onClick={() => onOpenTask(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="board__empty">No tasks found</p>
                    )}

                    {/* Ruang yang dikosongkan semasa drag — wajib untuk dnd */}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default Board;
