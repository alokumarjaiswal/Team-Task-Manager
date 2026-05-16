import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users } from 'lucide-react';
import { projectIdToColor } from '../../utils/projectColor';

const navItems = [
  { path: '/',         label: 'Overview',   Icon: LayoutDashboard },
  { path: '/projects', label: 'Projects',   Icon: FolderKanban    },
  { path: '/tasks',    label: 'Task Board', Icon: CheckSquare     },
  { path: '/team',     label: 'Team',       Icon: Users           },
];

export default function ProjectSidebar({ projects = [], isOpen = false, onClose }) {
  const location = useLocation();

  return (
    <aside className={isOpen ? 'project-sidebar project-sidebar--open' : 'project-sidebar'} aria-label="Project navigation">
      <div className="project-sidebar__section">
        <div className="project-sidebar__heading">Projects</div>
        <nav className="project-sidebar__nav">
          {navItems.map(({ path, label, Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(`${path}/`);
            return (
              <Link
                key={path}
                to={path}
                className={active ? 'project-sidebar__link is-active' : 'project-sidebar__link'}
                onClick={onClose}
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                  style={{ color: active ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)', flexShrink: 0 }}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="project-sidebar__section project-sidebar__section--projects">
        <div className="project-sidebar__heading">Your projects</div>
        <div className="project-sidebar__list">
          {projects.map((project) => {
            const active = location.pathname === `/projects/${project._id}` || location.pathname.startsWith(`/projects/${project._id}/`);
            const dotColor = projectIdToColor(project._id);
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className={active ? 'project-sidebar__project is-active' : 'project-sidebar__project'}
                onClick={onClose}
              >
                <span
                  className="project-sidebar__project-dot"
                  aria-hidden="true"
                  style={{ background: dotColor }}
                />
                <span className="project-sidebar__project-name">{project.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
