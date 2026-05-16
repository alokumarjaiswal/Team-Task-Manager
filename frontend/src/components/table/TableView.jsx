import { useMemo, Fragment } from 'react';
import TableRow from './TableRow';

const palette = ['#58a6ff', '#d29922', '#3fb950', '#f85149', '#a371f7', '#8b949e'];

const colorForIndex = (index) => palette[index % palette.length];

const getGroupValue = (task, groupBy, users) => {
  if (groupBy === 'assignee') {
    if (!task.assignedTo) return 'Unassigned';
    const user = users.find((entry) => String(entry._id) === String(task.assignedTo));
    return user ? user.name : 'Unassigned';
  }

  if (groupBy === 'milestone') {
    return task.milestone || 'No milestone';
  }

  if (groupBy === 'label') {
    const labels = Array.isArray(task.labels) ? task.labels : [];
    return labels[0] || 'No label';
  }

  return task.status || 'todo';
};

export default function TableView({ tasks, users, onTaskClick, sortKey, sortDir, onSort, onStatusChange, onAssigneeChange, groupBy = 'status', visibleFields = {}, density = 'comfortable' }) {
  const groupDefinitions = useMemo(() => {
    if (groupBy === 'assignee') {
      const assignees = [...new Set(tasks.map((task) => getGroupValue(task, groupBy, users)))].sort((left, right) => left.localeCompare(right));
      return assignees.map((assignee, index) => ({ key: assignee, label: assignee, accent: colorForIndex(index), tasks: tasks.filter((task) => getGroupValue(task, groupBy, users) === assignee) }));
    }

    if (groupBy === 'milestone') {
      const milestones = [...new Set(tasks.map((task) => getGroupValue(task, groupBy, users)))].sort((left, right) => left.localeCompare(right));
      return milestones.map((milestone, index) => ({ key: milestone, label: milestone, accent: colorForIndex(index), tasks: tasks.filter((task) => getGroupValue(task, groupBy, users) === milestone) }));
    }

    if (groupBy === 'label') {
      const labels = [...new Set(tasks.map((task) => getGroupValue(task, groupBy, users)))].sort((left, right) => left.localeCompare(right));
      return labels.map((label, index) => ({ key: label, label, accent: colorForIndex(index), tasks: tasks.filter((task) => getGroupValue(task, groupBy, users) === label) }));
    }

    return [
      { key: 'todo', label: 'Todo', accent: '#58a6ff', tasks: tasks.filter((task) => task.status === 'todo') },
      { key: 'in-progress', label: 'In Progress', accent: '#d29922', tasks: tasks.filter((task) => task.status === 'in-progress') },
      { key: 'done', label: 'Done', accent: '#3fb950', tasks: tasks.filter((task) => task.status === 'done') },
    ];
  }, [groupBy, tasks, users]);

  const columnCount = 4 + (visibleFields.description !== false ? 1 : 0) + (visibleFields.milestone !== false ? 1 : 0) + (visibleFields.labels !== false ? 1 : 0) + (visibleFields.dueDate !== false ? 1 : 0) + (visibleFields.assignee !== false ? 1 : 0);

  return (
    <div className="table-view">
      <table className="table-view__table">
        <thead>
          <tr>
            <th>
              <button type="button" className="table-view__header-button" onClick={() => onSort('title')}>
                Title {sortKey === 'title' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th>
              <button type="button" className="table-view__header-button" onClick={() => onSort('status')}>
                Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            {visibleFields.description !== false ? <th>Description</th> : null}
            {visibleFields.milestone !== false ? <th>Milestone</th> : null}
            {visibleFields.labels !== false ? <th>Labels</th> : null}
            {visibleFields.dueDate !== false ? <th>Due</th> : null}
            <th>
              <button type="button" className="table-view__header-button" onClick={() => onSort('updatedAt')}>
                Updated {sortKey === 'updatedAt' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            {visibleFields.assignee !== false ? <th>Assignee</th> : null}
          </tr>
        </thead>
        <tbody>
          {groupDefinitions.map((group) => (
            <Fragment key={group.key}>
              <tr className="table-view__group-row">
                <td colSpan={columnCount} style={{ padding: '12px 14px', fontWeight: 600, background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: group.accent }} />
                    {group.label}
                    <span style={{ opacity: 0.7 }}>({group.tasks.length})</span>
                  </span>
                </td>
              </tr>
              {group.tasks.map((task) => (
                <TableRow
                  key={task._id}
                  task={task}
                  users={users}
                  onOpen={() => onTaskClick(task)}
                  onStatusChange={onStatusChange}
                  onAssigneeChange={onAssigneeChange}
                  visibleFields={visibleFields}
                  density={density}
                />
              ))}
            </Fragment>
          ))}
          <tr className="table-view__new-row">
            <td colSpan={columnCount}>New item</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
