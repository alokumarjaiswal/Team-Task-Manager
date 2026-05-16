# Implementation Plan: github-design-system-v3

## Overview

Full GitHub-quality UI/UX overhaul — third pass. CSS + JSX only. No new dependencies. No backend changes. Twelve surfaces addressed across five dependency waves.

---

## Tasks

- [ ] 1. Update design tokens and global CSS foundations
  - [x] 1.1 Add `--color-btn-hover-bg` token to `github-tokens.css`
    - Add `--color-btn-hover-bg: #f3f4f6` to the `:root` block
    - Add `--color-btn-hover-bg: #30363d` to the `.dark` block
    - _Requirements: 10.1, 10.2_

  - [x] 1.2 Fix `.btn` hover and add heading reset in `index.css`
    - Change `.btn:hover:not(:disabled)` from `background: #30363d` to `background: var(--color-btn-hover-bg)`
    - Add `h1 { font-size: var(--font-size-2xl); font-weight: 600; }` to global reset
    - Add `h2 { font-size: var(--font-size-xl); font-weight: 600; }` to global reset
    - Add `h3 { font-size: var(--font-size-lg); font-weight: 600; }` to global reset
    - Place heading rules after the `*` box-sizing block and before component rules
    - _Requirements: 10.3, 11.1, 11.2, 11.3, 11.4_

  - [-] 1.3 Fix Landing page dark mode text in `index.css`
    - Change `.landing-column__header h2` color from `#24292f` to `var(--color-fg-default)`
    - Change `.landing-card h3` color from `#24292f` to `var(--color-fg-default)`
    - Change `.landing-stat strong, .landing-feature h3` color from `#24292f` to `var(--color-fg-default)`
    - Change `.landing-stat span, .landing-feature p` color from `#24292f` to `var(--color-fg-muted)`
    - No JSX changes required
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [-] 1.4 Add hamburger button and mobile sidebar CSS to `index.css`
    - Add `.hamburger-btn` rule: `display: none` by default, `display: inline-flex` inside `@media (max-width: 800px)`
    - Update the existing `@media (max-width: 800px)` `.project-sidebar` rule: add `position: fixed`, `top: 56px`, `left: 0`, `height: calc(100vh - 56px)`, `z-index: 30`, `transform: translateX(-100%)`, `transition: transform 0.2s ease`
    - Add `.project-sidebar.project-sidebar--open { transform: translateX(0) }` inside the same media query
    - _Requirements: 8.5, 8.9, 8.10_

  - [-] 1.5 Add filter popover CSS classes to `index.css`
    - Add `position: relative` to `.filter-bar__actions`
    - Add `.filter-bar__count-badge` with `margin-left: 6px; opacity: 0.7`
    - Add `.filter-popover` with GitHub-exact styling: `border-radius: 6px`, `box-shadow: 0 8px 24px rgba(140,149,159,0.2)`, no blur
    - Add `.filter-popover__list`, `.filter-popover__option`, `.filter-popover__option--active`, `.filter-popover__hint`, `.filter-popover__footer`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [-] 1.6 Add Team page CSS classes to `index.css`
    - Add `.team-page`, `.team-grid`, `.team-card`, `.team-avatar`, `.team-avatar--admin`
    - Add `.team-role-badge`, `.team-role-badge--admin`, `.team-role-badge--member`
    - Add `.team-delete-btn`, `.team-email-row`, `.team-you-badge`
    - Add `.modal-close-btn`
    - _Requirements: 2.1–2.11, 2.16_

  - [x] 1.7 Add remaining component CSS classes to `index.css`
    - Add `.table-view__group-header`, `.table-view__group-label`, `.table-view__group-dot`, `.table-view__group-count`
    - Add `.task-panel__label`
    - Add `.project-header-shell__title-row`, `.project-header-shell__saving`
    - Add `.board-card__labels`, `.board-card__label-badge`
    - Add all Dashboard lower-section classes: `.dashboard-page-title`, `.dashboard-distribution-panel`, `.dashboard-distribution-left`, `.dashboard-distribution-right`, `.dashboard-distribution-desc`, `.dashboard-status-row` and modifiers, `.dashboard-status-dot`, `.dashboard-status-label`, `.dashboard-status-value`, `.dashboard-status-pct`, `.dashboard-bottom-row`, `.dashboard-recent-tasks`, `.dashboard-task-list`, `.dashboard-task-item`, `.dashboard-task-item__header`, `.dashboard-empty`, `.dashboard-activity-col`, `.dashboard-activity-scroll`, `.dashboard-activity-item`, `.dashboard-activity-item__action`, `.dashboard-activity-item__detail`, `.dashboard-activity-item__time`
    - _Requirements: 4.1–4.4, 5.1, 6.1, 6.2, 9.1, 12.1–12.21_

- [ ] 2. Remove TaskBoard and update routing
  - [-] 2.1 Delete `TaskBoard.jsx` and update `App.jsx`
    - Delete `frontend/src/pages/TaskBoard.jsx`
    - Remove `const TaskBoard = lazy(() => import('./pages/TaskBoard'))` from `App.jsx`
    - Remove `TaskBoard` from `RoutesWrapper` props and destructuring
    - Replace `<Route path="tasks" element={<TaskBoard />} />` with `<Route path="tasks" element={<Navigate to="/projects" />} />`
    - Ensure `Navigate` is already imported from `react-router-dom` (it is)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Add hamburger menu to AppShell, TopNav, and ProjectSidebar
  - [-] 3.1 Update `AppShell.jsx` to manage sidebar open state
    - Import `useState` and `React` (for `cloneElement`)
    - Add `const [sidebarOpen, setSidebarOpen] = useState(false)` state
    - Use `React.cloneElement(topNav, { onToggleSidebar: () => setSidebarOpen(v => !v), sidebarOpen })` to pass props to TopNav
    - Use `React.cloneElement(sidebar, { isOpen: sidebarOpen, onClose: () => setSidebarOpen(false) })` to pass props to ProjectSidebar
    - Guard both cloneElement calls with null checks
    - _Requirements: 8.6, 8.7_

  - [-] 3.2 Update `TopNav.jsx` to render hamburger button
    - Add `onToggleSidebar` and `sidebarOpen` to the component props (default to `undefined`/`false`)
    - Import `Menu` and `X` from `lucide-react` (alongside existing imports)
    - Render `<button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle navigation" aria-expanded={sidebarOpen} aria-controls="project-sidebar">` in `top-nav__left`, before the brand link
    - Render `<X size={18} />` when `sidebarOpen` is true, `<Menu size={18} />` otherwise
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.12_

  - [ ] 3.3 Update `ProjectSidebar.jsx` to accept `isOpen` and `onClose` props
    - Add `isOpen = false` and `onClose = () => {}` to props
    - Add `id="project-sidebar"` to the `<aside>` element
    - Change `className` to `project-sidebar${isOpen ? ' project-sidebar--open' : ''}`
    - Add `onClick={onClose}` to every `<Link>` element in both nav sections
    - _Requirements: 8.8, 8.11, 8.12_

- [ ] 4. Refactor JSX components — inline style removal
  - [~] 4.1 Refactor `FilterBar.jsx` — replace all inline styles with CSS classes
    - Remove `menuShellStyle`, `menuListStyle`, and `menuButtonStyle` constant objects
    - In `renderMenu()`: replace each popover container `<div style={menuShellStyle}>` with `<div className="filter-popover">`
    - Replace each option list container with `<div className="filter-popover__list">`
    - Replace each option button with `className={active ? 'filter-popover__option filter-popover__option--active' : 'filter-popover__option'}` and remove all inline styles
    - Replace hint text `<div style={{...}}>` with `<div className="filter-popover__hint">`
    - Replace footer rows `<div className="flex-between" style={{...}}>` with `<div className="filter-popover__footer">`
    - Remove `style={{ position: 'relative' }}` from `filter-bar__actions` wrapper (now in CSS)
    - Replace count badge `<span style={{ marginLeft: '6px', opacity: 0.7 }}>` with `<span className="filter-bar__count-badge">`
    - _Requirements: 1.7–1.13_

  - [~] 4.2 Refactor `ProjectHeader.jsx` — replace inline styles
    - Change title/delete row `<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>` to `<div className="project-header-shell__title-row">`
    - Change Delete button `style={{ height: '34px' }}` to `className="btn btn-danger project-header-shell__delete-btn"` (remove inline style)
    - Change saving indicator `<span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>` to `<span className="project-header-shell__saving">`
    - _Requirements: 6.4, 6.5, 6.6_

  - [~] 4.3 Refactor `BoardCard.jsx` — replace labels container inline style
    - Change labels container `<div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>` to `<div className="board-card__labels">`
    - Change each label `<span>` from `style={{ textTransform: 'none' }}` to `className="roadmap-task__status-badge roadmap-task__status-badge--todo board-card__label-badge"` (remove inline style)
    - _Requirements: 9.2, 9.3_

  - [~] 4.4 Refactor `TaskDetailPanel.jsx` — replace form label inline styles
    - Change Status `<label>` from `style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}` to `className="task-panel__label"`
    - Change Assignee `<label>` from same inline style to `className="task-panel__label"`
    - _Requirements: 5.2, 5.3_

  - [~] 4.5 Refactor `TableView.jsx` — replace group header inline styles
    - Change group header `<td style={{...}}>` to `<td colSpan={columnCount} className="table-view__group-header">`
    - Change group label `<span style={{...}}>` to `<span className="table-view__group-label">`
    - Change color dot `<span style={{ width: '10px', ... background: group.accent }}>` to `<span className="table-view__group-dot" style={{ background: group.accent }}>`
    - Change count `<span style={{ opacity: 0.7 }}>` to `<span className="table-view__group-count">`
    - _Requirements: 4.5, 4.6, 4.7_

  - [~] 4.6 Refactor `Team.jsx` — full CSS class migration
    - Replace page root `<div>` inline styles with `className="team-page"`
    - Replace grid `<div style={{...}}>` with `<div className="team-grid">`
    - Replace each card `<div className="glass-panel" style={{...}}>` with `<div className="glass-panel team-card">`
    - Replace avatar `<div style={{...}}>` with `<div className={u.role === 'admin' ? 'team-avatar team-avatar--admin' : 'team-avatar'}>`
    - Replace role badge `<div style={{...}}>` with `<div className={u.role === 'admin' ? 'team-role-badge team-role-badge--admin' : 'team-role-badge team-role-badge--member'}>`
    - Replace delete button `<button style={{...}}>` with `<button className="team-delete-btn">`
    - Replace email row `<div style={{...}}>` with `<div className="team-email-row">`
    - Replace "(You)" `<span style={{...}}>` with `<span className="team-you-badge">`
    - Replace modal overlay `<div style={{...}}>` with `<div className="modal-overlay">`
    - Replace modal dialog `<div className="glass-panel" style={{...}}>` with `<div className="modal-dialog">`
    - Replace modal close button `<button style={{...}}>` with `<button className="modal-close-btn">`
    - Replace page header row `<div className="flex-between" style={{marginBottom: '24px'}}>` with `<div className="flex-between">` (gap handled by `.team-page`)
    - _Requirements: 2.12–2.15_

- [ ] 5. Refactor `Dashboard.jsx` — lower-section inline style removal
  - [~] 5.1 Replace Dashboard page title and Task Distribution panel inline styles
    - Change `<h2 style={{marginBottom: '24px'}}>` to `<h2 className="dashboard-page-title">`
    - Change Task Distribution outer panel inner `<div style={{ display: 'flex', ... }}>` to `<div className="dashboard-distribution-panel">`
    - Change left column `<div style={{ flex: '1', minWidth: '220px' }}>` to `<div className="dashboard-distribution-left">`
    - Change right column `<div style={{ flex: '1', minWidth: '280px', height: '280px' }}>` to `<div className="dashboard-distribution-right">`
    - Change description `<p style={{...}}>` to `<p className="dashboard-distribution-desc">`
    - Change Task Distribution `<h3 style={{...}}>` to `<h3 className="dashboard-section-title">`
    - _Requirements: 12.1–12.3, 12.9, 12.22_

  - [~] 5.2 Replace status row inline styles with modifier classes
    - Change the `.map()` data array to `{ label, modifier, value, dotColor, valueColor }` shape:
      - `{ label: 'To Do', modifier: 'todo', value: todoCount, dotColor: 'var(--color-fg-subtle)', valueColor: 'var(--color-fg-subtle)' }`
      - `{ label: 'In Progress', modifier: 'in-progress', value: inProgressCount, dotColor: 'var(--color-attention-fg)', valueColor: 'var(--color-attention-fg)' }`
      - `{ label: 'Done', modifier: 'done', value: doneCount, dotColor: 'var(--color-success-fg)', valueColor: 'var(--color-success-fg)' }`
    - Replace each row `<div style={{...}}>` with `<div className={\`dashboard-status-row dashboard-status-row--${item.modifier}\`}>`
    - Replace dot `<div style={{...}}>` with `<div className="dashboard-status-dot" style={{ background: item.dotColor }}>`
    - Replace label `<span style={{...}}>` with `<span className="dashboard-status-label">`
    - Replace value `<span style={{...}}>` with `<span className="dashboard-status-value" style={{ color: item.valueColor }}>`
    - Replace pct `<span style={{...}}>` with `<span className="dashboard-status-pct">`
    - _Requirements: 12.4–12.8, 12.10_

  - [~] 5.3 Replace Recent Tasks section inline styles
    - Change bottom row `<div style={{ display: 'flex', gap: '24px' }}>` to `<div className="dashboard-bottom-row">`
    - Change Recent Tasks column `<div className="glass-panel" style={{ flex: 1 }}>` to `<div className="glass-panel dashboard-recent-tasks">`
    - Change task list container `<div style={{...}}>` to `<div className="dashboard-task-list">`
    - Change each project row `<div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', ... }}>` to `<div className="dashboard-task-item">`
    - Change empty state `<p style={{...}}>` to `<p className="dashboard-empty">`
    - _Requirements: 12.11–12.15_

  - [~] 5.4 Replace Activity Logs section inline styles
    - Change Activity column `<div style={{ flex: 1, display: 'flex', ... }}>` to `<div className="dashboard-activity-col">`
    - Change scroll container `<div style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>` to `<div className="dashboard-activity-scroll">`
    - Change each activity entry `<div style={{ padding: '12px 0', borderBottom: '...' }}>` to `<div className="dashboard-activity-item">`
    - Change action `<span style={{...}}>` to `<span className="dashboard-activity-item__action">`
    - Change detail `<div style={{...}}>` to `<div className="dashboard-activity-item__detail">`
    - Change timestamp `<div style={{...}}>` to `<div className="dashboard-activity-item__time">`
    - _Requirements: 12.16–12.23_

- [~] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify: light mode `.btn` hover is light, dark mode Landing text is readable, hamburger appears on mobile, `/tasks` redirects to `/projects`, FilterBar popovers have correct styling, Team page renders correctly in dark mode.

---

## Notes

- The only permitted inline styles after this pass are truly dynamic runtime values: `group.accent` on table/board color dots, `item.dotColor`/`item.valueColor` on dashboard status rows, and `projectIdToColor(project._id)` on project cards (from v2 spec)
- `AppShell.jsx` uses `React.cloneElement` to thread sidebar state — this is the minimal-change approach that avoids prop-drilling through `Layout.jsx`
- The hamburger button is CSS-hidden on desktop (`display: none`) and shown on mobile via media query — no JS viewport detection needed
- TaskBoard.jsx deletion removes ~300 lines of duplicate code and a non-GitHub color palette (`#6366F1`, `#10B981`)
- Heading font-weight rules use low specificity (`h1`, `h2`, `h3`) so component-specific classes like `.project-header-shell__title` override them naturally

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["6"] }
  ]
}
```
