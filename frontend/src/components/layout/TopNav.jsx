import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Sun, Moon, Menu } from 'lucide-react';
import GitHubMark from '../shared/GitHubMark';

const sectionLabels = [
  { matcher: (path) => path.startsWith('/projects'), label: 'Projects' },
  { matcher: (path) => path.startsWith('/tasks'), label: 'Tasks' },
  { matcher: (path) => path.startsWith('/team'), label: 'Team' },
  { matcher: () => true, label: 'Overview' },
];

export default function TopNav({
  user,
  onLogout,
  onToggleTheme,
  themeLabel,
  darkMode,
  onCreate,
  onToggleSidebar,
  sidebarOpen,
}) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const currentSection = sectionLabels.find((item) => item.matcher(location.pathname))?.label || 'Overview';

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  return (
    <header className="top-nav">
      <div className="top-nav__left">
        <button
          type="button"
          className="hamburger-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={Boolean(sidebarOpen)}
          onClick={onToggleSidebar}
        >
          <Menu size={16} />
        </button>
        <Link to="/" className="top-nav__brand-link" aria-label="Go to overview">
          <GitHubMark width={18} height={18} />
          <span className="top-nav__brand">Team Task Manager</span>
        </Link>
        <span className="top-nav__section">{currentSection}</span>
      </div>

      <div className="top-nav__right">
        <button className="icon-button" type="button" aria-label="Create new" onClick={onCreate}>
          <Plus size={16} />
        </button>
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={themeLabel}>
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="avatar-button"
            type="button"
            onClick={() => setOpen(v => !v)}
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={open}
          >
            {initial}
          </button>
          {open && (
            <div className="avatar-dropdown" role="menu">
              <div className="avatar-dropdown__header">
                {user?.name}
              </div>
              <button
                type="button"
                role="menuitem"
                className="avatar-dropdown__item"
                onClick={() => { setOpen(false); onLogout(); }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
