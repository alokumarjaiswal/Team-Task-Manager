import { useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function RoadmapView({ tasks, users, onTaskClick, visibleFields = {}, density = 'comfortable' }) {
  // Organize tasks by time periods
  const roadmapData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const timePeriods = {
      overdue: { label: 'Overdue', tasks: [], color: '#f85149' },
      thisWeek: { label: 'This Week', tasks: [], color: '#d29922' },
      nextWeek: { label: 'Next Week', tasks: [], color: '#58a6ff' },
      later: { label: 'Later', tasks: [], color: '#3fb950' },
      noDueDate: { label: 'No Due Date', tasks: [], color: '#6e7681' },
    };

    tasks.forEach((task) => {
      if (!task.dueDate) {
        timePeriods.noDueDate.tasks.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);
      if (Number.isNaN(dueDate.getTime())) {
        timePeriods.noDueDate.tasks.push(task);
        return;
      }
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        timePeriods.overdue.tasks.push(task);
      } else if (diffDays < 7) {
        timePeriods.thisWeek.tasks.push(task);
      } else if (diffDays < 14) {
        timePeriods.nextWeek.tasks.push(task);
      } else {
        timePeriods.later.tasks.push(task);
      }
    });

    // Sort tasks within each period by due date
    Object.values(timePeriods).forEach((period) => {
      period.tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    });

    return timePeriods;
  }, [tasks]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusIcon = (status) => {
    if (status === 'done') {
      return <CheckCircle2 size={16} style={{ color: '#3fb950' }} />;
    }
    return <Circle size={16} style={{ color: '#6e7681' }} />;
  };

  const getAssigneeName = (assigneeId) => {
    if (!assigneeId) return 'Unassigned';
    const user = users.find((u) => String(u._id) === String(assigneeId));
    return user ? user.name : 'Unknown';
  };

  return (
    <div className="roadmap-view">
      {Object.entries(roadmapData).map(([key, period]) => (
        <div key={key} className="roadmap-period">
          <div
            className="roadmap-period__header"
            style={{ borderLeftColor: period.color }}
          >
            <h3 className="roadmap-period__title">{period.label}</h3>
            <span className="roadmap-period__count">{period.tasks.length}</span>
          </div>

          {period.tasks.length > 0 ? (
            <div className="roadmap-period__tasks">
              {period.tasks.map((task) => (
                <div
                  key={task._id}
                  className={`roadmap-task ${task.status === 'done' ? 'is-done' : ''}`}
                  onClick={() => onTaskClick?.(task)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onTaskClick?.(task);
                    }
                  }}
                >
                  <div className="roadmap-task__header">
                    <div className="roadmap-task__status">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="roadmap-task__title-row">
                      <h4 className="roadmap-task__title">{task.title}</h4>
                      <span className="roadmap-task__id">#{String(task._id).slice(-4)}</span>
                    </div>
                  </div>

                  {visibleFields.milestone !== false && task.milestone ? (
                    <div className="roadmap-task__meta-item" style={{ marginTop: '2px' }}>
                      <span className="roadmap-task__status-badge roadmap-task__status-badge--todo" style={{ textTransform: 'none' }}>
                        {task.milestone}
                      </span>
                    </div>
                  ) : null}

                  {visibleFields.description !== false && density !== 'compact' ? (
                    <p className="roadmap-task__description">{task.description}</p>
                  ) : null}

                  {visibleFields.labels !== false && Array.isArray(task.labels) && task.labels.length > 0 ? (
                    <div className="roadmap-task__meta" style={{ gap: '8px' }}>
                      {task.labels.map((label) => (
                        <span key={label} className="roadmap-task__status-badge roadmap-task__status-badge--todo" style={{ textTransform: 'none' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="roadmap-task__meta">
                    <div className="roadmap-task__meta-item">
                      <span className="roadmap-task__meta-label">Due:</span>
                      <span className="roadmap-task__meta-value">
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {visibleFields.assignee !== false ? (
                      <div className="roadmap-task__meta-item">
                      <span className="roadmap-task__meta-label">Assigned:</span>
                      <span className="roadmap-task__meta-value">
                        {getAssigneeName(task.assignedTo)}
                      </span>
                      </div>
                    ) : null}
                    {task.status && (
                      <div className="roadmap-task__meta-item">
                        <span
                          className={`roadmap-task__status-badge roadmap-task__status-badge--${task.status}`}
                        >
                          {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="roadmap-period__empty">
              <p>No tasks in this period</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
