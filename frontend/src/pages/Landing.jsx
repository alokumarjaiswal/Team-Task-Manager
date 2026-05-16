import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ListChecks, Moon, ArrowRight, GitBranch, ShieldCheck, Sparkles, Sun } from 'lucide-react';

const boardPreview = [
  {
    title: 'Todo',
    count: 3,
    color: '#58a6ff',
    items: [
      { id: '1258', title: 'Write product brief', label: 'Docs' },
      { id: '1281', title: 'Review scope with team', label: 'Planning' },
    ],
  },
  {
    title: 'In progress',
    count: 2,
    color: '#d29922',
    items: [
      { id: '1324', title: 'Implement onboarding flow', label: 'UI' },
      { id: '1336', title: 'Sync live updates', label: 'API' },
    ],
  },
  {
    title: 'Done',
    count: 5,
    color: '#3fb950',
    items: [
      { id: '1402', title: 'Set up auth', label: 'Core' },
      { id: '1417', title: 'Ship board view', label: 'Release' },
    ],
  },
];

const features = [
  {
    icon: ListChecks,
    title: 'Track work like GitHub Projects',
    description: 'Board, table, and roadmap views with a familiar issue-first workflow.',
  },
  {
    icon: GitBranch,
    title: 'Real-time collaboration',
    description: 'Socket-powered updates keep the board in sync for the whole team.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    description: 'JWT auth, role-aware access, and protected APIs stay in place.',
  },
];

export default function Landing() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="landing-nav__brand">
          <span className="landing-mark" aria-hidden="true">⌘</span>
          <span>Team Task Manager</span>
        </div>

        <div className="landing-nav__actions">
          <button className="icon-button landing-theme-toggle" type="button" onClick={() => setDarkMode((current) => !current)} aria-label="Toggle theme">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn landing-secondary landing-login">Sign in</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <motion.div
            className="landing-hero__copy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="landing-kicker">
              <Sparkles size={14} />
              Built for teams who ship
            </div>
            <h1>Plan, track, and ship — a lightweight issue-first board for teams.</h1>
            <p>
              Focused boards, realtime sync, and role-aware access so your team can collaborate
              without noise.
            </p>
            <div className="landing-hero__actions">
              <Link to="/login" className="btn btn--primary landing-cta">Try it free <ArrowRight size={16} /></Link>
            </div>
            <div className="landing-proof">
              <span><CheckCircle2 size={14} /> Issue-first workflow</span>
              <span><CheckCircle2 size={14} /> Realtime sync</span>
              <span><CheckCircle2 size={14} /> Role-aware security</span>
            </div>
          </motion.div>

          <motion.div
            className="landing-preview"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="landing-preview__topbar">
              <span className="landing-preview__dot" />
              <span className="landing-preview__dot" />
              <span className="landing-preview__dot" />
            </div>
            <div className="landing-preview__board">
              {boardPreview.map((column) => (
                <section className="landing-column" key={column.title}>
                  <div className="landing-column__header">
                    <span className="landing-column__status" style={{ background: column.color }} />
                    <h2>{column.title}</h2>
                    <span>{column.count}</span>
                  </div>
                  <div className="landing-column__list">
                    {column.items.map((item) => (
                      <article className="landing-card" key={item.id}>
                        <div className="landing-card__row">
                          <Circle size={12} />
                          <span className="landing-card__id">#{item.id}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <div className="landing-card__label">{item.label}</div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="landing-stats" aria-label="Product stats">
          {[
            ['Live sync', 'Socket.IO updates'],
            ['3 views', 'Board, table, roadmap'],
            ['Secure', 'JWT and role-based access'],
          ].map(([label, value]) => (
            <div className="landing-stat" key={label}>
              <strong>{label}</strong>
              <span>{value}</span>
            </div>
          ))}
        </section>

        <section className="landing-features" id="features">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="landing-feature" key={feature.title}>
                <div className="landing-feature__icon"><Icon size={18} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}