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
 * - Kedudukan dalam kolom ditentukan oleh turutan task dalam senarai rata.
 */
const moveTask = (
  tasks: Task[],
  taskId: string,
  sourceColumnId: ColumnId,
  destinationColumnId: ColumnId,
  destinationIndex: number
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

  // (i) Susun semula dalam kolom yang sama — hanya tukar kedudukan.
  if (sourceColumnId === destinationColumnId) {
    const columnTasks = withoutDragged.filter(
      (task) => task.columnId === sourceColumnId
    );
    columnTasks.splice(destinationIndex, 0, movedTask);
    const otherTasks = withoutDragged.filter(
      (task) => task.columnId !== sourceColumnId
    );
    return [...otherTasks, ...columnTasks];
  }

  // (ii) Pindah ke kolom lain — masukkan pada index destinasi.
  const destinationTasks = withoutDragged.filter(
    (task) => task.columnId === destinationColumnId
  );
  destinationTasks.splice(destinationIndex, 0, movedTask);
  const remainingTasks = withoutDragged.filter(
    (task) => task.columnId !== destinationColumnId
  );
  return [...remainingTasks, ...destinationTasks];
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

    // Kemaskini state — LocalStorage ditulis automatik oleh useLocalStorage.
    setTasks((prevTasks) =>
      moveTask(
        prevTasks,
        draggableId,
        sourceColumnId,
        destinationColumnId,
        destination.index
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
                  aria-label={`Tambah task baharu ke kolom ${COLUMN_TITLES[columnId]}`}
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
                      <p className="board__empty">Tiada task</p>
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
