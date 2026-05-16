import { useEffect, useState } from 'react';
import React from 'react';

export default function AppShell({ topNav, sidebar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  const navWithToggle = topNav
    ? React.cloneElement(topNav, {
        onToggleSidebar: () => setSidebarOpen((v) => !v),
        sidebarOpen,
      })
    : topNav;

  const sidebarWithOpen = sidebar
    ? React.cloneElement(sidebar, {
        isOpen: sidebarOpen,
        onClose: () => setSidebarOpen(false),
      })
    : sidebar;

  return (
    <div className="app-shell">
      {navWithToggle}
      <button
        type="button"
        aria-label="Close navigation"
        className={sidebarOpen ? 'app-shell__backdrop is-visible' : 'app-shell__backdrop'}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="app-shell__body">
        {sidebarWithOpen}
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
