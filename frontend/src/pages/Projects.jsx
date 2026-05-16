import { useEffect, useMemo, useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Loader2, Search } from 'lucide-react';
import KebabMenu from '../components/shared/KebabMenu';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { getSocket, releaseSocket } from '../services/socket';
import { projectAPI, taskAPI } from '../services/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');
  const navigate = useNavigate();
  const { user } = useAuth();

  const notifyProjectsChanged = () => {
    window.dispatchEvent(new CustomEvent('projects:changed'));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        projectAPI.getAll(),
        taskAPI.getAll(),
      ]);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();
    socket.on('taskUpdated', fetchData);
    socket.on('projectCreated', fetchData);
    socket.on('projectUpdated', fetchData);
    socket.on('projectDeleted', fetchData);
    return () => {
      socket.off('taskUpdated', fetchData);
      socket.off('projectCreated', fetchData);
      socket.off('projectUpdated', fetchData);
      socket.off('projectDeleted', fetchData);
      releaseSocket();
    };
  }, [fetchData]);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.create(newProject);
      setShowProjectModal(false);
      setNewProject({ name: '', description: '' });
      toast.success('Project created successfully!');
      notifyProjectsChanged();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating project');
    }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.update(editingProject._id, {
        name: editingProject.name,
        description: editingProject.description,
      });
      setEditingProject(null);
      toast.success('Project updated successfully!');
      notifyProjectsChanged();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error updating project');
    }
  };

  const deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      notifyProjectsChanged();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting project');
    }
  };

  const projectTaskStats = useMemo(() => {
    const stats = new Map();
    for (const task of tasks) {
      const projectId = String(task.projectId);
      if (!stats.has(projectId)) {
        stats.set(projectId, { open: 0, done: 0, total: 0 });
      }
      const entry = stats.get(projectId);
      entry.total += 1;
      if (task.status === 'done') {
        entry.done += 1;
      } else {
        entry.open += 1;
      }
    }
    return stats;
  }, [tasks]);

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) => [project.name, project.description].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [projects, query]);

  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return String(a.name || '').localeCompare(String(b.name || ''));
      }

      if (sortBy === 'tasks') {
        const aTotal = projectTaskStats.get(String(a._id))?.total || 0;
        const bTotal = projectTaskStats.get(String(b._id))?.total || 0;
        return bTotal - aTotal;
      }

      const aUpdated = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bUpdated = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bUpdated - aUpdated;
    });
    return sorted;
  }, [filteredProjects, projectTaskStats, sortBy]);

  const formatUpdatedAt = (project) => {
    const value = project.updatedAt || project.createdAt;
    if (!value) return 'Unknown';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="projects-page">
      <div className="projects-index-header glass-panel">
        <div>
          <div className="project-page-header__eyebrow">Projects</div>
          <h2 className="project-page-header__title">{user?.role === 'admin' ? 'Projects' : 'Project workspace'}</h2>
          <p className="project-page-header__subtitle">Track active work in a GitHub-style project list.</p>
        </div>
        <div className="projects-index-header__actions">
          {user?.role === 'admin' && (
            <button className="btn btn--primary" onClick={() => setShowProjectModal(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      <div className="projects-toolbar glass-panel">
        <div className="projects-toolbar__search">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
          />
        </div>
        <div className="projects-toolbar__controls">
          <label className="projects-toolbar__sort" htmlFor="project-sort">
            Sort
          </label>
          <select
            id="project-sort"
            className="projects-toolbar__select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="name">Name</option>
            <option value="tasks">Most tasks</option>
          </select>
          <div className="projects-toolbar__hint">{sortedProjects.length} results</div>
        </div>
      </div>

      {loading ? (
        <div className="projects-loading">
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="projects-list glass-panel" role="table" aria-label="Projects list">
          <div className="projects-list__head" role="row">
            <span role="columnheader">Project</span>
            <span role="columnheader">Open</span>
            <span role="columnheader">Done</span>
            <span role="columnheader">Members</span>
            <span role="columnheader">Progress</span>
            <span role="columnheader">Updated</span>
            <span role="columnheader" className="projects-list__actions-head">Actions</span>
          </div>
          {sortedProjects.map((project) => {
            const taskStat = projectTaskStats.get(String(project._id)) || { open: 0, done: 0, total: 0 };
            const progress = taskStat.total === 0 ? 0 : Math.round((taskStat.done / taskStat.total) * 100);

            return (
              <div key={project._id} className="projects-list__row" role="row">
                <div className="projects-list__project" role="cell">
                  <button type="button" className="projects-list__name-link" onClick={() => navigate(`/projects/${project._id}`)}>
                    {project.name}
                  </button>
                  <p className="projects-list__description">{project.description || 'No description provided.'}</p>
                </div>

                <span role="cell" className="projects-list__metric">{taskStat.open}</span>
                <span role="cell" className="projects-list__metric">{taskStat.done}</span>
                <span role="cell" className="projects-list__metric">{project.members?.length || 0}</span>
                <span role="cell" className="projects-list__progress">{progress}%</span>
                <span role="cell" className="projects-list__updated">{formatUpdatedAt(project)}</span>

                <div role="cell" className="projects-list__actions">
                  <button type="button" className="projects-list__open-btn" onClick={() => navigate(`/projects/${project._id}`)}>
                    Open
                  </button>

                  <KebabMenu
                    ariaLabel={`Actions for ${project.name}`}
                    items={[
                      { label: 'Open', onClick: () => navigate(`/projects/${project._id}`) },
                      ...(user?.role === 'admin'
                        ? [
                            { label: 'Edit', onClick: () => setEditingProject(project) },
                            { label: 'Delete', onClick: () => deleteProject(project._id), danger: true }
                          ]
                        : [])
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filteredProjects.length === 0 && (
        <div className="projects-empty">
          <h3>{projects.length === 0 ? 'No projects yet' : 'No matching projects'}</h3>
          <p className="projects-empty__description">
            {projects.length === 0
              ? 'Create a project to organize work and invite teammates.'
              : 'Try a different search query or change sorting options.'}
          </p>
          {user?.role === 'admin' && <button className="btn btn--primary" onClick={() => setShowProjectModal(true)}><Plus size={14} /> New Project</button>}
        </div>
      )}

      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3>Create Project</h3>
            <form onSubmit={createProject}>
              <input type="text" placeholder="Project Name" required value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
              <textarea placeholder="Description" rows={3} value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
              <div className="flex-between" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-danger" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3>Edit Project</h3>
            <form onSubmit={updateProject}>
              <input type="text" placeholder="Project Name" required value={editingProject.name} onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })} />
              <textarea placeholder="Description" rows={3} value={editingProject.description} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} />
              <div className="flex-between" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-danger" onClick={() => setEditingProject(null)}>Cancel</button>
                <button type="submit" className="btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
