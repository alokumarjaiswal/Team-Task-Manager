import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const Login = lazy(() => import('./components/Login'));
const Layout = lazy(() => import('./components/Layout'));
const DashboardHome = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const Team = lazy(() => import('./pages/Team'));
const Landing = lazy(() => import('./pages/Landing'));

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Suspense fallback={<div className="project-board__loading">Loading…</div>}>
          <RoutesWrapper
            Login={Login}
            Layout={Layout}
            DashboardHome={DashboardHome}
            Projects={Projects}
            ProjectWorkspace={ProjectWorkspace}
            TaskBoard={TaskBoard}
            Team={Team}
            Landing={Landing}
          />
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

import useAuth from './hooks/useAuth';

function RoutesWrapper({ Login, Layout, DashboardHome, Projects, ProjectWorkspace, TaskBoard, Team, Landing }) {
  const { user, loading, setUser } = useAuth() || {};

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />

      {user ? (
        <Route path="/" element={<Layout user={user} setUser={setUser} />}>
          <Route index element={<DashboardHome />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectWorkspace defaultView="board" />} />
          <Route path="projects/:id/table" element={<ProjectWorkspace defaultView="table" />} />
          <Route path="projects/:id/roadmap" element={<ProjectWorkspace defaultView="roadmap" />} />
          <Route path="projects/:id/task/:taskId" element={<ProjectWorkspace defaultView="board" />} />
          <Route path="projects/:id/roadmap/task/:taskId" element={<ProjectWorkspace defaultView="roadmap" />} />
          <Route path="tasks" element={<TaskBoard />} />
          <Route path="team" element={<Team />} />
        </Route>
      ) : (
        <>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}
    </Routes>
  );
}

export default App;
