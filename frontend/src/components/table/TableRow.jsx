export default function TableRow({ task, users, onOpen, onStatusChange, onAssigneeChange, visibleFields = {} }) {
  const labels = Array.isArray(task.labels) ? task.labels : [];

  return (
    <tr className="table-view__row">
      <td>
        <button type="button" className="table-view__link" onClick={onOpen}>
          {task.title}
        </button>
      </td>
      <td>
        <select
          value={task.status || 'todo'}
          aria-label={`Status for ${task.title}`}
          onChange={(event) => onStatusChange(task, event.target.value)}
        >
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </td>
      {visibleFields.description !== false ? <td>{task.description || '-'}</td> : null}
      {visibleFields.milestone !== false ? <td>{task.milestone || '-'}</td> : null}
      {visibleFields.labels !== false ? <td>{labels.length > 0 ? labels.join(', ') : '-'}</td> : null}
      {visibleFields.dueDate !== false ? <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td> : null}
      <td>{task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '-'}</td>
      {visibleFields.assignee !== false ? (
        <td>
        <select
          value={task.assignedTo || ''}
          aria-label={`Assignee for ${task.title}`}
          onChange={(event) => onAssigneeChange(task, event.target.value)}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>{user.name}</option>
          ))}
        </select>
        </td>
      ) : null}
    </tr>
  );
}
