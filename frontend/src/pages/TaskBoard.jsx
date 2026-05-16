import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSocket, releaseSocket } from '../services/socket';
import { taskAPI, userAPI } from '../services/api';
import BoardView from '../components/board/BoardView';
import TaskDetailPanel from '../components/task/TaskDetailPanel';

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.allSettled([
        taskAPI.getAll(),
        userAPI.getAll(),
      ]);

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value.data);
      } else {
        setTasks([]);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data);
      } else {
        setUsers([]);
      }

      const messages = [];
      if (tasksRes.status === 'rejected') {
        const reason = tasksRes.reason;
        messages.push(reason?.response?.data?.error || reason?.message || 'Failed to load tasks');
      }
      if (usersRes.status === 'rejected') {
        const reason = usersRes.reason;
        messages.push(reason?.response?.data?.error || reason?.message || 'Failed to load users');
      }

      setError(messages.join(' — '));
    } catch (err) {
      setTasks([]);
      setUsers([]);
      const message = err?.response?.data?.error || err?.message || 'Failed to load task board';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    socket.on('taskUpdated', fetchData);
    return () => {
      socket.off('taskUpdated', fetchData);
      releaseSocket();
    };
  }, [fetchData]);

  useEffect(() => {
    if (!selectedTask) return;
    const refreshedTask = tasks.find((task) => String(task._id) === String(selectedTask._id));
    if (refreshedTask && refreshedTask !== selectedTask) {
      setSelectedTask(refreshedTask);
    }
  }, [selectedTask, tasks]);

  const handleSave = async (draft) => {
    await taskAPI.update(draft._id, {
      title: draft.title,
      description: draft.description,
      status: draft.status,
      assignedTo: draft.assignedTo,
      dueDate: draft.dueDate || null,
      labels: draft.labelsText,
      milestone: draft.milestone,
    });
    await fetchData();
    setSelectedTask(null);
  };

  const handleAddComment = async (taskId, text) => {
    await taskAPI.addComment(taskId, text);
    await fetchData();
  };

  const handleAttachFile = async (taskId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await taskAPI.addAttachment(taskId, formData);
    await fetchData();
  };

  const currentTask = selectedTask
    ? tasks.find((task) => String(task._id) === String(selectedTask._id)) || selectedTask
    : null;

  return (
    <div>
      <div className="project-page-header glass-panel" style={{ marginBottom: '20px' }}>
        <div>
          <div className="project-page-header__eyebrow">Task Board</div>
          <h2 className="project-page-header__title">All tasks across your workspace</h2>
          <p className="project-page-header__subtitle">Track work, move items between statuses, and open task details from one shared board.</p>
        </div>
        <div className="project-page-header__actions">
          <div className="project-stat">
            <span>{tasks.length} tasks</span>
          </div>
          <div className="project-stat">
            <span>{users.length} members</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="project-board__loading">Loading…</div>
      ) : error ? (
        <div className="glass-panel" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </div>
      ) : (
        <BoardView
          tasks={tasks}
          users={users}
          onTaskClick={setSelectedTask}
          visibleFields={{ assignee: true, description: true, dueDate: true, labels: true, milestone: true, comments: true }}
          density="comfortable"
        />
      )}

      {currentTask && (
        <TaskDetailPanel
          task={currentTask}
          assignee={users.find((entry) => String(entry._id) === String(currentTask.assignedTo))}
          users={users}
          onClose={() => setSelectedTask(null)}
          onSave={handleSave}
          onAddComment={handleAddComment}
          onAttachFile={handleAttachFile}
        />
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="glass-panel" style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
          No tasks found.
        </div>
      )}

    </div>
  );
}
