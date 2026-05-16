# Design Document — github-design-system-v3

## Overview

Full GitHub-quality UI/UX overhaul — third pass. All changes are **CSS + JSX only**. No new npm dependencies. No backend changes. Twelve surfaces are addressed in a single coordinated pass.

---

## Architecture

| Constraint | Detail |
|---|---|
| Scope | `frontend/src` only |
| CSS changes | `github-tokens.css`, `index.css` |
| JSX changes | `App.jsx`, `AppShell.jsx`, `TopNav.jsx`, `ProjectSidebar.jsx`, `FilterBar.jsx`, `ProjectHeader.jsx`, `BoardCard.jsx`, `TaskDetailPanel.jsx`, `TableView.jsx`, `Team.jsx`, `Dashboard.jsx` |
| Files deleted | `frontend/src/pages/TaskBoard.jsx` |
| New files | None |
| New dependencies | None |

### Design Principles

1. **Token-first** — every color, spacing, and radius references a CSS custom property. No hardcoded hex values in new rules.
2. **Class-driven** — all visual styles live in `index.css`. `style` props are reserved for truly dynamic runtime values (e.g. `group.accent` color dot).
3. **GitHub-exact popovers** — `border-radius: 6px`, `box-shadow: 0 8px 24px rgba(140,149,159,0.2)`, no `backdrop-filter`.
4. **Mobile-first sidebar** — `translateX(-100%)` default on ≤800px, slides in with `translateX(0)` via `.project-sidebar--open`.

---

## 1. CSS Token Additions (`github-tokens.css`)

```css
/* Light mode */
--color-btn-hover-bg: #f3f4f6;

/* Dark mode (.dark block) */
--color-btn-hover-bg: #30363d;
```

---

## 2. `index.css` Changes

### 2a. Global reset additions (after `*` rule, before component rules)

```css
h1 { font-size: var(--font-size-2xl); font-weight: 600; }
h2 { font-size: var(--font-size-xl);  font-weight: 600; }
h3 { font-size: var(--font-size-lg);  font-weight: 600; }
```

### 2b. Fix `.btn` hover

```css
/* Change from: background: #30363d */
.btn:hover:not(:disabled) {
  background: var(--color-btn-hover-bg);
}
```

### 2c. Landing dark mode text fix

Replace all `color: #24292f` in landing rules:
- `.landing-column__header h2` → `color: var(--color-fg-default)`
- `.landing-card h3` → `color: var(--color-fg-default)`
- `.landing-stat strong, .landing-feature h3` → `color: var(--color-fg-default)`
- `.landing-stat span, .landing-feature p` → `color: var(--color-fg-muted)`

### 2d. Hamburger button

```css
.hamburger-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-btn-border);
  background: var(--color-btn-bg);
  color: var(--color-fg-default);
  cursor: pointer;
}

@media (max-width: 800px) {
  .hamburger-btn {
    display: inline-flex;
  }
}
```

### 2e. Mobile sidebar slide-in (update existing `@media (max-width: 800px)` block)

```css
@media (max-width: 800px) {
  .project-sidebar {
    position: fixed;
    top: 56px;
    left: 0;
    height: calc(100vh - 56px);
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    border-right: 1px solid var(--color-border-muted);
  }

  .project-sidebar.project-sidebar--open {
    transform: translateX(0);
  }
}
```

### 2f. Filter popover classes

```css
/* ── Filter Popover ── */
.filter-bar__actions {
  position: relative;
}

.filter-bar__count-badge {
  margin-left: 6px;
  opacity: 0.7;
}

.filter-popover {
  position: absolute;
  top: 52px;
  left: 0;
  min-width: 280px;
  max-width: 360px;
  background: var(--color-canvas-default);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
  padding: 12px;
  z-index: 20;
}

.filter-popover__list {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.filter-popover__option {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-default);
  background: transparent;
  cursor: pointer;
  color: var(--color-fg-default);
  font-size: var(--font-size-md);
  transition: background-color 0.1s ease;
}

.filter-popover__option:hover {
  background: var(--color-canvas-subtle);
}

.filter-popover__option--active {
  border-color: var(--color-accent-emphasis);
  background: rgba(88, 166, 255, 0.12);
}

.filter-popover__hint {
  font-size: var(--font-size-sm);
  color: var(--color-fg-muted);
  margin-top: 6px;
}

.filter-popover__footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}
```

### 2g. Team page classes

```css
/* ── Team Page ── */
.team-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.team-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
}

.team-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-accent-emphasis);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: bold;
  color: var(--color-fg-on-emphasis);
}

.team-avatar--admin {
  background: linear-gradient(135deg, var(--color-attention-fg), var(--color-accent-emphasis));
}

.team-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 20px;
}

.team-role-badge--admin {
  color: var(--color-attention-fg);
  background: rgba(210, 153, 34, 0.12);
}

.team-role-badge--member {
  color: var(--color-fg-default);
  background: var(--color-canvas-inset);
}

.team-delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--color-danger-emphasis);
  color: var(--color-fg-on-emphasis);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: opacity 0.2s;
}

.team-delete-btn:hover {
  opacity: 0.85;
}

.team-email-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-fg-muted);
  font-size: var(--font-size-md);
  margin-bottom: 8px;
}

.team-you-badge {
  font-size: var(--font-size-xs);
  color: var(--color-success-fg);
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-fg-muted);
}
```

### 2h. TableView group header classes

```css
.table-view__group-header {
  padding: 12px 14px;
  font-weight: 600;
  background: var(--color-canvas-subtle);
  border-top: 1px solid var(--color-border-default);
}

.table-view__group-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.table-view__group-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex-shrink: 0;
}

.table-view__group-count {
  opacity: 0.7;
}
```

### 2i. TaskDetailPanel label class

```css
.task-panel__label {
  font-size: var(--font-size-sm);
  color: var(--color-fg-muted);
  margin-top: 8px;
  display: block;
}
```

### 2j. ProjectHeader classes

```css
.project-header-shell__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-header-shell__saving {
  font-size: var(--font-size-sm);
  color: var(--color-fg-muted);
  margin-left: 8px;
}
```

### 2k. BoardCard labels class

```css
.board-card__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.board-card__label-badge {
  text-transform: none;
}
```

### 2l. Dashboard lower-section classes

```css
/* ── Dashboard lower sections ── */
.dashboard-page-title {
  margin-bottom: 24px;
}

.dashboard-distribution-panel {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  flex-wrap: wrap;
}

.dashboard-distribution-left {
  flex: 1;
  min-width: 220px;
}

.dashboard-distribution-right {
  flex: 1;
  min-width: 280px;
  height: 280px;
}

.dashboard-distribution-desc {
  color: var(--color-fg-muted);
  font-size: var(--font-size-md);
  margin-bottom: 24px;
  line-height: 1.6;
}

.dashboard-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--border-radius-sm);
}

.dashboard-status-row--todo        { background: rgba(110, 118, 129, 0.12); }
.dashboard-status-row--in-progress { background: rgba(210, 153, 34, 0.12); }
.dashboard-status-row--done        { background: rgba(63, 185, 80, 0.12); }

.dashboard-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dashboard-status-label {
  flex: 1;
  font-size: var(--font-size-md);
  font-weight: 500;
}

.dashboard-status-value {
  font-weight: bold;
  font-size: var(--font-size-xl);
}

.dashboard-status-pct {
  font-size: var(--font-size-sm);
  color: var(--color-fg-muted);
  min-width: 36px;
  text-align: right;
}

.dashboard-bottom-row {
  display: flex;
  gap: 24px;
}

.dashboard-recent-tasks {
  flex: 1;
}

.dashboard-task-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-task-item {
  padding: 16px;
  border-left: 4px solid var(--color-accent-emphasis);
  background: var(--color-canvas-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
}

.dashboard-task-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.dashboard-empty {
  color: var(--color-fg-muted);
  margin-top: 12px;
}

.dashboard-activity-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-activity-scroll {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.dashboard-activity-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-muted);
}

.dashboard-activity-item__action {
  font-weight: normal;
  color: var(--color-fg-muted);
}

.dashboard-activity-item__detail {
  font-size: var(--font-size-sm);
  color: var(--color-fg-muted);
  margin-top: 4px;
}

.dashboard-activity-item__time {
  font-size: var(--font-size-xs);
  color: var(--color-fg-muted);
  margin-top: 4px;
}
```

---

## 3. JSX Changes

### 3a. `App.jsx` — Remove TaskBoard, add `/tasks` redirect

```jsx
// Remove:
const TaskBoard = lazy(() => import('./pages/TaskBoard'));

// In RoutesWrapper, replace:
<Route path="tasks" element={<TaskBoard />} />
// With:
<Route path="tasks" element={<Navigate to="/projects" />} />

// Remove TaskBoard from RoutesWrapper props
```

### 3b. `AppShell.jsx` — Add sidebarOpen state + pass to children

```jsx
import { useState } from 'react';

export default function AppShell({ topNav, sidebar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="app-shell__body">
        {sidebarWithOpen}
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
```

### 3c. `TopNav.jsx` — Add hamburger button

```jsx
import { Menu, X } from 'lucide-react'; // add to existing import

// Add props: onToggleSidebar, sidebarOpen
// In top-nav__left, before brand link:
<button
  className="hamburger-btn"
  type="button"
  onClick={onToggleSidebar}
  aria-label="Toggle navigation"
  aria-expanded={sidebarOpen}
  aria-controls="project-sidebar"
>
  {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
</button>
```

### 3d. `ProjectSidebar.jsx` — Accept isOpen + add id + close on nav

```jsx
// Add props: isOpen = false, onClose
// Add id="project-sidebar" to <aside>
// Add isOpen to className:
className={`project-sidebar${isOpen ? ' project-sidebar--open' : ''}`}

// On each Link, add onClick={onClose}
```

### 3e. `FilterBar.jsx` — Replace all inline styles with CSS classes

The `menuShellStyle`, `menuListStyle`, and `menuButtonStyle` objects are removed. Each `renderMenu()` panel uses `className="filter-popover"`. Option lists use `className="filter-popover__list"`. Option buttons use `className={active ? 'filter-popover__option filter-popover__option--active' : 'filter-popover__option'}`. Hint text uses `className="filter-popover__hint"`. Footer rows use `className="filter-popover__footer"`. The `filter-bar__actions` wrapper removes `style={{ position: 'relative' }}` (now in CSS). Count badges use `className="filter-bar__count-badge"` instead of inline `style={{ marginLeft: '6px', opacity: 0.7 }}`.

### 3f. `ProjectHeader.jsx` — Replace inline styles

```jsx
// Before:
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
// After:
<div className="project-header-shell__title-row">

// Before:
<button ... style={{ height: '34px' }}>
// After:
<button ... className="btn btn-danger project-header-shell__delete-btn">

// Before:
<span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
// After:
<span className="project-header-shell__saving">
```

### 3g. `BoardCard.jsx` — Replace labels container inline style

```jsx
// Before:
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
// After:
<div className="board-card__labels">

// Label spans: add className="board-card__label-badge" and remove style={{ textTransform: 'none' }}
```

### 3h. `TaskDetailPanel.jsx` — Replace label inline styles

```jsx
// Before:
<label htmlFor="task-status" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
// After:
<label htmlFor="task-status" className="task-panel__label">

// Same for Assignee label
```

### 3i. `TableView.jsx` — Replace group header inline styles

```jsx
// Before:
<td colSpan={columnCount} style={{ padding: '12px 14px', fontWeight: 600, background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)' }}>
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: group.accent }} />
    {group.label}
    <span style={{ opacity: 0.7 }}>({group.tasks.length})</span>
  </span>
// After:
<td colSpan={columnCount} className="table-view__group-header">
  <span className="table-view__group-label">
    <span className="table-view__group-dot" style={{ background: group.accent }} />
    {group.label}
    <span className="table-view__group-count">({group.tasks.length})</span>
  </span>
```

### 3j. `Team.jsx` — Full CSS class migration

Replace all inline styles with the new CSS classes. Modal uses `.modal-overlay` + `.modal-dialog`. Close button uses `.modal-close-btn`. Member cards use `.team-card.glass-panel`. Avatars use `.team-avatar` + `.team-avatar--admin`. Role badges use `.team-role-badge` + modifier. Delete button uses `.team-delete-btn`. Email row uses `.team-email-row`. The page header row uses `.flex-between` with a `margin-bottom` via `.team-page` gap.

### 3k. `Dashboard.jsx` — Lower-section refactor

- `<h2 style={{marginBottom: '24px'}}>` → `<h2 className="dashboard-page-title">`
- Task Distribution panel inner div → `className="dashboard-distribution-panel"`
- Left column → `className="dashboard-distribution-left"`
- Right column → `className="dashboard-distribution-right"`
- Description `<p>` → `className="dashboard-distribution-desc"`
- Status rows `.map()` → use `{ label, modifier, value, dotColor, valueColor }` shape; rows get `className={\`dashboard-status-row dashboard-status-row--${item.modifier}\`}`; dot gets `className="dashboard-status-dot"` + `style={{ background: item.dotColor }}`; value gets `className="dashboard-status-value"` + `style={{ color: item.valueColor }}`; pct gets `className="dashboard-status-pct"`
- Bottom row → `className="dashboard-bottom-row"`
- Recent tasks column → `className="glass-panel dashboard-recent-tasks"`
- Task list → `className="dashboard-task-list"`
- Each task item → `className="dashboard-task-item"` (remove `.glass-panel` and all inline styles)
- Empty state → `className="dashboard-empty"`
- Activity column → `className="dashboard-activity-col"`
- Activity scroll → `className="dashboard-activity-scroll"`
- Each activity entry → `className="dashboard-activity-item"`
- Action span → `className="dashboard-activity-item__action"`
- Detail div → `className="dashboard-activity-item__detail"`
- Time div → `className="dashboard-activity-item__time"`

---

## 4. File Deletion

`frontend/src/pages/TaskBoard.jsx` — deleted. Route `/tasks` redirects to `/projects` via `<Navigate>`.

---

## 5. Error Handling

- `AppShell.cloneElement` — both `topNav` and `sidebar` are guarded with null checks before cloning.
- `/tasks` redirect — uses React Router `<Navigate>` which is safe even if the user bookmarked the old URL.
- `ProjectSidebar` `onClose` prop — defaults to `() => {}` so existing usages without the prop don't break.

---

## 6. Testing Strategy

All changes are structural (class names, prop threading, file deletion). Verify manually:
1. Light mode: hover a `.btn` — background should be `#f3f4f6`, not dark.
2. Dark mode: Landing page text should be readable (not `#24292f` on dark background).
3. Mobile (≤800px): hamburger button appears, sidebar slides in/out.
4. `/tasks` route: redirects to `/projects`.
5. FilterBar popovers: open cleanly with correct border-radius and shadow, no blur.
6. Team page: dark mode renders correctly with token-based colors.
