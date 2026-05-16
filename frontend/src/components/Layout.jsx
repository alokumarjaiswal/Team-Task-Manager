import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from './layout/AppShell';
import TopNav from './layout/TopNav';
import ProjectSidebar from './layout/ProjectSidebar';
import { projectAPI } from '../services/api';
import { getSocket, releaseSocket } from '../services/socket';

export default function Layout({ user, setUser }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        const { data } = await projectAPI.getAll();
        if (isMounted) {
          setProjects(data);
        }
      } catch {
        if (isMounted) {
          setProjects([]);
        }
      }
    };

    const handleProjectsChanged = () => {
      loadProjects();
    };

    loadProjects();

    const socket = getSocket();
    socket.on('projectCreated', loadProjects);
    socket.on('projectUpdated', loadProjects);
    socket.on('projectDeleted', loadProjects);
    window.addEventListener('projects:changed', handleProjectsChanged);

    return () => {
      isMounted = false;
      socket.off('projectCreated', loadProjects);
      socket.off('projectUpdated', loadProjects);
      socket.off('projectDeleted', loadProjects);
      window.removeEventListener('projects:changed', handleProjectsChanged);
      releaseSocket();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const navigate = useNavigate();

  const handleCreate = () => {
    // Navigate to projects list where user can create a new project
    navigate('/projects');
  };

  const themeLabel = darkMode ? 'Light' : 'Dark';

  return (
    <AppShell
      topNav={(
          <TopNav
            user={user}
            onLogout={handleLogout}
            onToggleTheme={() => setDarkMode((current) => !current)}
            themeLabel={themeLabel}
            darkMode={darkMode}
            onCreate={handleCreate}
          />
      )}
      sidebar={<ProjectSidebar projects={projects} />}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
