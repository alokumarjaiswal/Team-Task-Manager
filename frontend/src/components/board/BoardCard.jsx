import { MessageSquare, Paperclip } from 'lucide-react';

export default function BoardCard({ task, user, onClick, provided, isDragging = false, visibleFields = {}, density = 'comfortable' }) {
  const labels = Array.isArray(task.labels) ? task.labels : [];
  const showDescription = visibleFields.description !== false && density !== 'compact';
  const showDueDate = visibleFields.dueDate !== false;
  const showLabels = visibleFields.labels !== false;
  const showMilestone = visibleFields.milestone !== false;
  const showAssignee = visibleFields.assignee !== false;
  const showComments = visibleFields.comments !== false;

  return (
    <div
      ref={provided?.innerRef}
      className={isDragging ? 'board-card board-card--button is-dragging' : 'board-card board-card--button'}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      style={{ ...provided?.draggableProps?.style }}
      role="button"
      tabIndex={0}
    >
      <div className="board-card__title-row">
        <input type="checkbox" readOnly checked={task.status === 'done'} aria-label={`Mark ${task.title} complete`} />
        <div className="board-card__issue-meta">#{String(task._id).slice(-4)}</div>
      </div>
      <div className="board-card__title">{task.title}</div>
      {showLabels && labels.length > 0 ? (
        <div className="board-card__labels">
          {labels.map((label) => (
            <span key={label} className="board-card__label">
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {showMilestone && task.milestone ? (
        <div className="board-card__milestone">{task.milestone}</div>
      ) : null}
      {showDescription && task.description ? <div className="board-card__description">{task.description}</div> : null}
      <div className="board-card__footer">
        <div className="board-card__footer-left">
          {showDueDate ? (task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date') : null}
        </div>
        <div className="board-card__footer-right">
          {showComments && task.Comments?.length > 0 && <span className="board-card__meta-pill"><MessageSquare size={11} /> {task.Comments.length}</span>}
          {task.Attachments?.length > 0 && <span className="board-card__meta-pill"><Paperclip size={11} /> {task.Attachments.length}</span>}
          {showAssignee && user && (
            <div className="board-card__avatar" title={user.name} style={{ background: 'var(--color-accent-emphasis)' }}>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
