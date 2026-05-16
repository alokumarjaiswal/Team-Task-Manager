export default function TaskSidebarMeta({ task, assignee }) {
  const labels = Array.isArray(task?.labels) ? task.labels : [];

  return (
    <aside className="task-panel__meta">
      <div className="task-panel__meta-group">
        <div className="task-panel__meta-label">Assignee</div>
        <div>{assignee?.name || 'Unassigned'}</div>
      </div>
      <div className="task-panel__meta-group">
        <div className="task-panel__meta-label">Status</div>
        <div>{task.status}</div>
      </div>
      <div className="task-panel__meta-group">
        <div className="task-panel__meta-label">Milestone</div>
        <div>{task.milestone || 'None'}</div>
      </div>
      <div className="task-panel__meta-group">
        <div className="task-panel__meta-label">Labels</div>
        <div>{labels.length > 0 ? labels.join(', ') : 'None'}</div>
      </div>
    </aside>
  );
}
