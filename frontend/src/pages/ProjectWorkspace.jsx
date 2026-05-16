import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import ProjectHeader from '../components/project/ProjectHeader';
import BoardView from '../components/board/BoardView';
import TableView from '../components/table/TableView';
import RoadmapView from '../components/board/RoadmapView';
import TaskDetailPanel from '../components/task/TaskDetailPanel';

export default function ProjectWorkspace({ defaultView = 'board' }) {
  const { user } = useAuth();
  const { id, taskId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [selectedMilestones, setSelectedMilestones] = useState([]);
  const [groupBy, setGroupBy] = useState('status');
  const [view, setView] = useState(defaultView);
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || null);
  const [sortKey, setSortKey] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [visibleFields, setVisibleFields] = useState({
    assignee: true,
    description: true,
    dueDate: true,
    labels: true,
    milestone: true,
    comments: true,
  });
  const [density, setDensity] = useState('comfortable');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    assignedTo: '',
    dueDate: '',
    labels: '',
    milestone: '',
  });

  const isTypingTarget = (element) => {
    if (!element) return false;
    const tagName = element.tagName;
    return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
  };

  const normalizeLabels = (labels) => {
    if (Array.isArray(labels)) {
      return labels.map((label) => String(label).trim()).filter(Boolean);
    }

    if (typeof labels === 'string') {
      return labels.split(',').map((label) => label.trim()).filter(Boolean);
    }

    return [];
  };

  const getTaskLabels = (task) => normalizeLabels(task?.labels);
  const getTaskMilestone = (task) => String(task?.milestone || '').trim();

  const labelOptions = useMemo(() => {
    const labels = new Set();
    tasks.forEach((task) => getTaskLabels(task).forEach((label) => labels.add(label)));
    return [...labels].sort((left, right) => left.localeCompare(right));
  }, [tasks]);

  const milestoneOptions = useMemo(() => {
    const milestones = new Set();
    tasks.forEach((task) => {
      const milestone = getTaskMilestone(task);
      if (milestone) milestones.add(milestone);
    });
    return [...milestones].sort((left, right) => left.localeCompare(right));
  }, [tasks]);

  const getViewFromPathname = (pathname) => {
    if (pathname.includes('/roadmap')) return 'roadmap';
    if (pathname.includes('/table')) return 'table';
    return 'board';
  };

  const getWorkspacePath = (nextView, nextTaskId = null) => {
    const basePath = nextView === 'table'
      ? `/projects/${id}/table`
      : nextView === 'roadmap'
        ? `/projects/${id}/roadmap`
        : `/projects/${id}`;

    return nextTaskId ? `${basePath}/task/${nextTaskId}` : basePath;
  };

  useEffect(() => {
    setView(getViewFromPathname(location.pathname));
    setSelectedTaskId(taskId || null);
  }, [location.pathname, taskId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [projectResult, tasksResult, usersResult] = await Promise.allSettled([
          projectAPI.getById(id),
          taskAPI.getAll(id),
          userAPI.getAll(),
        ]);

        const errors = [];
        let nextProject = null;
        let projectLoadFailed = false;

        if (projectResult.status === 'fulfilled') {
          nextProject = projectResult.value.data;
        } else {
          const r = projectResult.reason;
          const msg = r?.response?.data?.error || r?.message || 'Unknown error';
          projectLoadFailed = true;
          errors.push(`Project: ${msg}`);
        }

        if (!nextProject?.name) {
          try {
            const fallbackProjects = await projectAPI.getAll();
            const fallbackProject = fallbackProjects.data.find((projectItem) => String(projectItem._id) === String(id)) || null;
            if (fallbackProject) {
              nextProject = fallbackProject;
              if (projectLoadFailed) {
                errors.shift();
              }
            }
          } catch {
            // Keep the current project value and fall back to the inline error message below.
          }
        }

        setProject(nextProject || null);

        if (projectLoadFailed && !nextProject?.name) {
          errors.unshift('Project: Route not found');
        }

        if (tasksResult.status === 'fulfilled') {
          setTasks(tasksResult.value.data.filter((task) => String(task.projectId) === String(id)));
        } else {
          const r = tasksResult.reason;
          const msg = r?.response?.data?.error || r?.message || 'Unknown error';
          errors.push(`Tasks: ${msg}`);
          setTasks([]);
        }

        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value.data);
        } else {
          const r = usersResult.reason;
          const msg = r?.response?.data?.error || r?.message || 'Unknown error';
          errors.push(`Users: ${msg}`);
          setUsers([]);
        }

        if (errors.length > 0) {
          const message = errors.join(' — ');
          setWorkspaceLoadError(message);
        } else {
          setWorkspaceLoadError('');
        }
      } catch (error) {
        setProject(null);
        setTasks([]);
        setUsers([]);
        const message = 'Failed to load project workspace. Please refresh and try again.';
        setWorkspaceLoadError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const openNewTask = useCallback((status = 'todo') => {
    setNewTask({ title: '', description: '', status, assignedTo: '', dueDate: '', labels: '', milestone: '' });
    setShowNewTaskModal(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (showNewTaskModal || selectedTaskId) return;
      if (view !== 'board') return;
      if (event.key.toLowerCase() !== 'n') return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      openNewTask('todo');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId, showNewTaskModal, view, openNewTask]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    let nextTasks = !query ? tasks : tasks.filter((task) => {
      const searchBlob = [
        task.title,
        task.description,
        getTaskMilestone(task),
        ...getTaskLabels(task),
      ].join(' ').toLowerCase();
      return searchBlob.includes(query);
    });
    if (filterStatus) {
      nextTasks = nextTasks.filter((task) => task.status === filterStatus);
    }
    if (filterAssignee) {
      nextTasks = nextTasks.filter((task) => String(task.assignedTo) === String(filterAssignee));
    }
    if (selectedLabels.length > 0) {
      nextTasks = nextTasks.filter((task) => {
        const taskLabels = getTaskLabels(task);
        return selectedLabels.some((label) => taskLabels.includes(label));
      });
    }
    if (selectedMilestones.length > 0) {
      nextTasks = nextTasks.filter((task) => selectedMilestones.includes(getTaskMilestone(task)));
    }
    if (!showCompleted) {
      nextTasks = nextTasks.filter((task) => task.status !== 'done');
    }

    const sortValue = (task) => {
      if (['createdAt', 'updatedAt', 'dueDate'].includes(sortKey)) {
        const value = task[sortKey];
        return value ? new Date(value).getTime() : 0;
      }

      if (sortKey === 'labels') {
        return getTaskLabels(task).join(', ').toLowerCase();
      }

      if (sortKey === 'milestone') {
        return getTaskMilestone(task).toLowerCase();
      }

      return String(task[sortKey] || '').toLowerCase();
    };

    return [...nextTasks].sort((left, right) => {
      const a = sortValue(left);
      const b = sortValue(right);
      if (a < b) return sortDir === 'asc' ? -1 : 1;
      if (a > b) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, search, sortKey, sortDir, filterStatus, filterAssignee, selectedLabels, selectedMilestones, showCompleted]);

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterAssignee('');
    setSelectedLabels([]);
    setSelectedMilestones([]);
    setShowCompleted(true);
  };

  const toggleLabel = (label) => {
    setSelectedLabels((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  };

  const toggleMilestone = (milestone) => {
    setSelectedMilestones((current) => (current.includes(milestone) ? current.filter((item) => item !== milestone) : [...current, milestone]));
  };

  const toggleField = (field) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const selectedTask = tasks.find((task) => String(task._id) === String(selectedTaskId)) || null;
  const selectedAssignee = selectedTask ? users.find((user) => String(user._id) === String(selectedTask.assignedTo)) : null;

  const updateSort = (key) => {
    setSortDir((current) => (sortKey === key ? (current === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
  };

  const openTask = (task) => {
    setSelectedTaskId(task._id);
    navigate(getWorkspacePath(view, task._id), { replace: false });
  };

  const handleSaveTask = async (draft) => {
    try {
      await taskAPI.update(draft._id, {
        title: draft.title,
        description: draft.description,
        status: draft.status,
        assignedTo: draft.assignedTo,
        dueDate: draft.dueDate,
        labels: normalizeLabels(draft.labelsText ?? draft.labels),
        milestone: draft.milestone,
      });
      toast.success('Task updated');
      const { data } = await taskAPI.getAll(id);
      setTasks(data.filter((task) => String(task.projectId) === String(id)));
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    if (!project) return;

    setCreatingTask(true);
    try {
      await taskAPI.create({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        assignedTo: newTask.assignedTo || undefined,
        dueDate: newTask.dueDate || undefined,
        labels: normalizeLabels(newTask.labels),
        milestone: newTask.milestone || undefined,
        projectId: project._id,
      });
      const { data } = await taskAPI.getAll(id);
      setTasks(data.filter((task) => String(task.projectId) === String(id)));
      setShowNewTaskModal(false);
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      window.dispatchEvent(new CustomEvent('projects:changed'));
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting project');
    }
  };

  const handleStatusChange = async (task, status) => {
    await handleSaveTask({ ...task, status });
  };

  const handleBoardMove = async (task, status) => {
    await handleSaveTask({ ...task, status });
  };

  const handleAssigneeChange = async (task, assignedTo) => {
    await handleSaveTask({ ...task, assignedTo });
  };

  const handleAddComment = async (taskId, text) => {
    try {
      await taskAPI.addComment(taskId, text);
      const { data } = await taskAPI.getAll(id);
      setTasks(data.filter((task) => String(task.projectId) === String(id)));
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleAttachFile = async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await taskAPI.addAttachment(taskId, formData);
      const { data } = await taskAPI.getAll(id);
      setTasks(data.filter((task) => String(task.projectId) === String(id)));
      toast.success('File attached');
    } catch {
      toast.error('Failed to attach file');
    }
  };

  const handleSort = (key) => {
    updateSort(key);
  };

  const closeTask = () => {
    setSelectedTaskId(null);
    navigate(getWorkspacePath(view));
  };

  const changeView = (nextView) => {
    setView(nextView);
    navigate(getWorkspacePath(nextView));
  };

  return (
    <div className="project-workspace">
      <ProjectHeader
        project={project}
        user={user}
        view={view}
        onViewChange={changeView}
        search={search}
        onSearch={setSearch}
        onNewItem={openNewTask}
        users={users}
        filterAssignee={filterAssignee}
        onFilterAssignee={setFilterAssignee}
        filterStatus={filterStatus}
        onFilterStatus={setFilterStatus}
        labelOptions={labelOptions}
        milestoneOptions={milestoneOptions}
        selectedLabels={selectedLabels}
        onToggleLabel={toggleLabel}
        selectedMilestones={selectedMilestones}
        onToggleMilestone={toggleMilestone}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={updateSort}
        visibleFields={visibleFields}
        onToggleField={toggleField}
        density={density}
        onDensityChange={setDensity}
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        onClearFilters={clearFilters}
        onDelete={deleteProject}
      />
      <div className="project-workspace__content">
        {loading ? (
          <div className="project-board__loading">Loading…</div>
        ) : (
          <>
            {workspaceLoadError && !project ? (
              <div className="project-workspace__error">
                {workspaceLoadError}
              </div>
            ) : null}
            {view === 'table' ? (
              <TableView
                tasks={filteredTasks}
                users={users}
                onTaskClick={openTask}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onStatusChange={handleStatusChange}
                onAssigneeChange={handleAssigneeChange}
                groupBy={groupBy}
                visibleFields={visibleFields}
                density={density}
              />
            ) : view === 'roadmap' ? (
              <RoadmapView tasks={filteredTasks} users={users} onTaskClick={openTask} visibleFields={visibleFields} density={density} />
            ) : (
              <BoardView
                tasks={filteredTasks}
                users={users}
                onTaskClick={openTask}
                onTaskMove={handleBoardMove}
                onAddTask={openNewTask}
                groupBy={groupBy}
                sortKey={sortKey}
                sortDir={sortDir}
                visibleFields={visibleFields}
                density={density}
              />
            )}
          </>
        )}
      </div>
      {selectedTask ? <TaskDetailPanel key={`${selectedTask._id}-${selectedTask.updatedAt || ''}`} task={selectedTask} assignee={selectedAssignee} users={users} onClose={closeTask} onSave={handleSaveTask} onAddComment={handleAddComment} onAttachFile={handleAttachFile} /> : null}

      {showNewTaskModal ? (
        <div className="modal-overlay" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-content wide glass-panel" onClick={(event) => event.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: 0 }}>New item</h3>
              <button type="button" className="btn btn-danger" onClick={() => setShowNewTaskModal(false)}>Close</button>
            </div>
            <form onSubmit={handleCreateTask} className="task-form">
              <input
                type="text"
                placeholder="Task title"
                required
                value={newTask.title}
                onChange={(event) => setNewTask((current) => ({ ...current, title: event.target.value }))}
              />
              <textarea
                placeholder="Task description"
                rows={4}
                value={newTask.description}
                onChange={(event) => setNewTask((current) => ({ ...current, description: event.target.value }))}
              />
              <div className="task-form-grid">
                <select value={newTask.status} onChange={(event) => setNewTask((current) => ({ ...current, status: event.target.value }))}>
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <select value={newTask.assignedTo} onChange={(event) => setNewTask((current) => ({ ...current, assignedTo: event.target.value }))}>
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(event) => setNewTask((current) => ({ ...current, dueDate: event.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Labels, comma separated"
                  value={newTask.labels}
                  onChange={(event) => setNewTask((current) => ({ ...current, labels: event.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Milestone"
                  value={newTask.milestone}
                  onChange={(event) => setNewTask((current) => ({ ...current, milestone: event.target.value }))}
                />
              </div>
              <div className="flex-between" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-danger" onClick={() => setShowNewTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={creatingTask}>{creatingTask ? 'Creating…' : 'Create item'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
