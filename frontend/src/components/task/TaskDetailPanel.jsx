import { useState } from 'react';
import { X } from 'lucide-react';
import TaskComments from './TaskComments';
import TaskSidebarMeta from './TaskSidebarMeta';

export default function TaskDetailPanel({ task, assignee, users = [], onClose, onSave, onAddComment, onAttachFile }) {
  const [draft, setDraft] = useState(() => ({
    ...task,
    labelsText: Array.isArray(task?.labels) ? task.labels.join(', ') : String(task?.labels || ''),
  }));
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState(null);

  if (!task) return null;

  return (
    <div className="task-panel" role="dialog" aria-modal="true" aria-label={`Task details for ${task.title}`}>
      <div className="task-panel__header">
        <div>
          <div className="task-panel__issue-number">#{String(task._id).slice(-4)}</div>
          <h2 className="task-panel__title">{task.title}</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close task details">
          <X size={16} />
        </button>
      </div>
      <div className="task-panel__body">
        <div className="task-panel__content">
          <input
            value={draft?.title || ''}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            aria-label="Task title"
            className="task-panel__input task-panel__input--title"
          />
          <textarea
            value={draft?.description || ''}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            rows={6}
            aria-label="Task description"
            className="task-panel__textarea"
          />
          <input
            value={draft?.labelsText || ''}
            onChange={(event) => setDraft({ ...draft, labelsText: event.target.value })}
            aria-label="Task labels"
            placeholder="Labels, comma separated"
            className="task-panel__input"
          />
          <input
            value={draft?.milestone || ''}
            onChange={(event) => setDraft({ ...draft, milestone: event.target.value })}
            aria-label="Task milestone"
            placeholder="Milestone"
            className="task-panel__input"
          />
          <label htmlFor="task-status" className="task-panel__field-label">
            Status
          </label>
          <select
            id="task-status"
            value={draft?.status || 'todo'}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            aria-label="Task status"
            className="task-panel__select"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <label htmlFor="task-assignee" className="task-panel__field-label">
            Assignee
          </label>
          <select
            id="task-assignee"
            value={String(draft?.assignedTo ?? '')}
            onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value ? Number(e.target.value) : null })}
            aria-label="Task assignee"
            className="task-panel__select"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <div className="task-panel__editor-actions">
            <button type="button" className="btn btn--primary" onClick={() => onSave(draft)}>Save changes</button>
          </div>
          <TaskComments comments={task.Comments || []} users={users} />
          <div className="task-panel__composer">
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} placeholder="Leave a comment" />
            <div className="task-panel__composer-actions">
              <input type="file" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
              <button type="button" className="btn" onClick={() => onAttachFile(task._id, attachment)} disabled={!attachment}>Attach</button>
              <button type="button" className="btn btn--primary" onClick={() => onAddComment(task._id, comment)} disabled={!comment.trim()}>Comment</button>
            </div>
          </div>
        </div>
        <TaskSidebarMeta task={task} assignee={assignee} />
      </div>
    </div>
  );
}
