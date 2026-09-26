import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { IonButton, IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import TaskCard from './TaskCard';
import { COLUMN_IDS, COLUMN_TITLES } from '../utils/columns';
import type { Dispatch, SetStateAction } from 'react';
import type { ColumnId, Task } from '../types';
import './Board.css';

/** Board props — now controlled by Home. */
interface BoardProps {
  /** Full task list (state source: Home → useLocalStorage). */
  tasks: Task[];
  /** Tasks state setter — used by the drag & drop handlers. */
  setTasks: Dispatch<SetStateAction<Task[]>>;
  /** Open the Create modal for a column ("+" button in the column header). */
  onAddTask: (columnId: ColumnId) => void;
  /** Open the Edit modal when a task card is clicked. */
  onOpenTask: (task: Task) => void;
}

/** Type guard — verify that a droppableId value is a valid column ID. */
const isColumnId = (value: string): value is ColumnId =>
  (COLUMN_IDS as string[]).includes(value);

/**
 * Move a task to a new position in the flat tasks list.
 * - Called by `handleDragEnd` after all validations are done.
 * - The task's `columnId` is changed to the destination column.
 * - `destinationIndex` refers to the VISIBLE order of the destination
 *   column (after filtering), so it is mapped to the neighbouring task
 *   ("anchor") in the full list — drag & drop stays accurate even when
 *   an active filter hides some tasks.
 */
const moveTask = (
  tasks: Task[],
  taskId: string,
  destinationColumnId: ColumnId,
  destinationIndex: number,
  /** Visible tasks of the destination column, excluding the dragged card. */
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

  // (i) Insert before the neighbouring task ("anchor") at the destination position.
  //     The destination index refers to the visible order; the anchor is
  //     the task shown at that position (no anchor = end of the column).
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

  // (ii) No anchor — place at the end of the destination column, i.e. before
  //      the first task of the following columns in board order.
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

  // (iii) The destination column is the last column — append to the end of the list.
  return [...withoutDragged, movedTask];
};

/**
 * Board — 5-column kanban layout with drag & drop between columns.
 * The Board is now controlled by Home: the tasks state and
 * CRUD actions (modal) are lifted up to the parent via props.
 */
const Board: React.FC<BoardProps> = ({
  tasks,
  setTasks,
  onAddTask,
  onOpenTask,
}) => {

  /**
   * Drag & drop handler — called by DragDropContext after
   * any drag completes OR is cancelled.
   */
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // (a) Card dropped outside any column (no destination) — cancel.
    if (!destination) {
      return;
    }

    // (b) Position unchanged (same column & index) — cancel.
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // (c) Verify both column IDs are valid (droppableId === ColumnId).
    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;
    if (!isColumnId(sourceColumnId) || !isColumnId(destinationColumnId)) {
      return;
    }

    // (d) The VISIBLE task list of the destination column (excluding the
    //     dragged card). The dnd destination index refers to the visible
    //     order; when a filter is active, it is only part of the full list.
    const visibleDestinationTasks = tasks.filter(
      (task) =>
        task.columnId === destinationColumnId && task.id !== draggableId
    );

    // Update the state — LocalStorage is written automatically by useLocalStorage.
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
          // Filter tasks by the current column
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

                {/* Open the Create Task modal for this column */}
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

              {/* Task list area — droppable for each column */}
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

                    {/* Space left empty during a drag — required by dnd */}
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
