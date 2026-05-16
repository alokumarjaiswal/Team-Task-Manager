import { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BoardColumn from './BoardColumn';
import BoardCard from './BoardCard';

const statusMap = [
  { key: 'todo', label: 'Todo', accent: '#58a6ff' },
  { key: 'in-progress', label: 'In Progress', accent: '#d29922' },
  { key: 'done', label: 'Done', accent: '#3fb950' },
];

const statusKeys = new Set(statusMap.map((column) => column.key));
const palette = ['#58a6ff', '#d29922', '#3fb950', '#f85149', '#a371f7', '#8b949e'];

const colorForIndex = (index) => palette[index % palette.length];

const getTaskGroupValue = (task, groupBy, users) => {
  if (groupBy === 'assignee') {
    if (!task.assignedTo) return 'unassigned';
    const assignee = users.find((user) => String(user._id) === String(task.assignedTo));
    return assignee ? String(assignee._id) : 'unassigned';
  }

  if (groupBy === 'milestone') {
    return String(task.milestone || '').trim() || 'No milestone';
  }

  if (groupBy === 'label') {
    const labels = Array.isArray(task.labels) ? task.labels : [];
    return labels[0] || 'No label';
  }

  return task.status || 'todo';
};

export default function BoardView({ tasks, users, onTaskClick, onTaskMove, onAddTask, groupBy = 'status', visibleFields = {}, density = 'comfortable' }) {
  const columns = useMemo(() => {
    if (groupBy === 'assignee') {
      const groups = new Map();
      users.forEach((user) => groups.set(String(user._id), { key: String(user._id), label: user.name, accent: colorForIndex(groups.size), tasks: [] }));
      groups.set('unassigned', { key: 'unassigned', label: 'Unassigned', accent: '#6e7681', tasks: [] });
      tasks.forEach((task) => {
        const key = getTaskGroupValue(task, groupBy, users);
        const group = groups.get(key) || groups.get('unassigned');
        group.tasks.push(task);
      });
      return [...groups.values()];
    }

    if (groupBy === 'milestone') {
      const milestoneValues = [...new Set(tasks.map((task) => getTaskGroupValue(task, groupBy, users)))].sort((left, right) => left.localeCompare(right));
      return milestoneValues.map((milestone, index) => ({ key: milestone, label: milestone, accent: colorForIndex(index), tasks: tasks.filter((task) => getTaskGroupValue(task, groupBy, users) === milestone) }));
    }

    if (groupBy === 'label') {
      const labelValues = [...new Set(tasks.map((task) => getTaskGroupValue(task, groupBy, users)))].sort((left, right) => left.localeCompare(right));
      return labelValues.map((label, index) => ({ key: label, label, accent: colorForIndex(index), tasks: tasks.filter((task) => getTaskGroupValue(task, groupBy, users) === label) }));
    }

    return statusMap.map((column) => ({ ...column, tasks: tasks.filter((task) => task.status === column.key) }));
  }, [groupBy, tasks, users]);

  const handleDragEnd = (result) => {
    if (groupBy !== 'status') return;
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!statusKeys.has(destination.droppableId)) return;

    const task = tasks.find((entry) => String(entry._id) === String(draggableId));
    if (!task || !onTaskMove) return;
    if (task.status === destination.droppableId) return;

    onTaskMove(task, destination.droppableId);
  };

  return (
    <div className={density === 'compact' ? 'board-columns board-columns--compact' : 'board-columns'}>
      {groupBy === 'status' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          {columns.map((column) => (
            <Droppable droppableId={column.key} key={column.key}>
              {(provided, snapshot) => (
                <BoardColumn
                  title={column.label}
                  count={column.tasks.length}
                  accent={column.accent}
                  droppableProps={provided.droppableProps}
                  innerRef={provided.innerRef}
                  isDraggingOver={snapshot.isDraggingOver}
                  placeholder={provided.placeholder}
                  onAddTask={onAddTask ? () => onAddTask(column.key) : undefined}
                >
                  {column.tasks.map((task, index) => (
                    <Draggable draggableId={String(task._id)} index={index} key={task._id}>
                      {(draggableProvided, draggableSnapshot) => (
                        <BoardCard
                          task={task}
                          user={users.find((entry) => String(entry._id) === String(task.assignedTo))}
                          onClick={() => onTaskClick(task)}
                          provided={draggableProvided}
                          isDragging={draggableSnapshot.isDragging}
                          visibleFields={visibleFields}
                          density={density}
                        />
                      )}
                    </Draggable>
                  ))}
                  {column.tasks.length === 0 && <div className="board-column__empty">Drop tasks here</div>}
                </BoardColumn>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      ) : (
        columns.map((column) => (
          <section className="board-column" key={column.key}>
            <div className="board-column__header">
              <div className="board-column__title-wrap">
                <span className="board-column__status-dot" style={{ background: column.accent }} aria-hidden="true" />
                <h3 className="board-column__title">{column.label}</h3>
                <span className="board-column__count">{column.tasks.length}</span>
              </div>
            </div>
            <div className="board-column__body">
              {column.tasks.map((task) => (
                <BoardCard
                  key={task._id}
                  task={task}
                  user={users.find((entry) => String(entry._id) === String(task.assignedTo))}
                  onClick={() => onTaskClick(task)}
                  visibleFields={visibleFields}
                  density={density}
                />
              ))}
              {column.tasks.length === 0 && <div className="board-column__empty">No tasks in this group</div>}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
