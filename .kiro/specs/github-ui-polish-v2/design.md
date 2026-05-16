# Design Document — github-ui-polish-v2

## Overview

This document describes the architecture and implementation plan for the second GitHub-quality UI/UX polish pass on the Team Task Manager frontend. All changes are **CSS + JSX only** — no backend modifications, no new npm dependencies. The work targets four areas: flat project cards, modal CSS classes, Dashboard inline-style elimination, and micro-interaction transitions. A minor Login.jsx cleanup is also included.

---

## Architecture

### Constraint Summary

| Constraint | Detail |
|---|---|
| Scope | `frontend/src` only |
| Files modified (CSS) | `frontend/src/index.css` |
| Files modified (JSX) | `Projects.jsx`, `ProjectWorkspace.jsx`, `Dashboard.jsx`, `Login.jsx` |
| New files | None |
| New dependencies | None |
| Backend changes | None |

### Design Principles

1. **Token-first**: Every color, spacing, and radius value must reference a CSS custom property from `github-tokens.css`. No hardcoded hex values in JSX `style` props or new CSS rules.
2. **Class-driven**: All visual and layout styles live in `index.css`. JSX elements carry class names; `style` props are reserved for truly dynamic values (e.g. the per-project accent color derived at runtime).
3. **Additive CSS**: New classes are appended to `index.css` in clearly labeled sections. Existing rules are modified only where a `transition` or `:active` rule needs to be added to an already-defined selector.
4. **No blur on modals**: The confirmed design decision is `rgba(0,0,0,0.6)` overlay with no `backdrop-filter`.
5. **Reuse `projectIdToColor`**: The existing utility at `frontend/src/utils/projectColor.js` is the single source of truth for project accent colors.

---

## Components and Interfaces

### 1. Project Card Redesign (`Projects.jsx` + `index.css`)

**Goal**: Replace the current `glass-panel`-based project card with a flat, bordered card that has a deterministic left accent strip.

#### CSS Changes (`index.css`)

The `.project-card` rule gains:
- `background: var(--color-canvas-subtle)`
- `border: 1px solid var(--color-border-default)`
- `border-radius: var(--border-radius-md)`
- `transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease`
- `position: relative` (already needed for `.project-card__actions`)

A new `.project-card:hover` rule:
```css
.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: var(--color-border-default);
}
```

The `.project-card__open` link gains:
```css
.project-card__open {
  transition: color 0.15s ease;
}
```

#### JSX Changes (`Projects.jsx`)

- Remove `.glass-panel` from each `project-card` `div`.
- Add a dynamic `style={{ borderLeft: `3px solid ${projectIdToColor(project._id)}` }}` on the card `div`. This is the **only** permitted inline style on the card — it is dynamic (runtime-computed per project) and cannot be expressed as a static CSS class.
- Import `projectIdToColor` from `../utils/projectColor`.
- All other card layout styles remain in the existing sub-element classes.

#### Data Flow

```
project._id  →  projectIdToColor(id)  →  CSS color string
                                          ↓
                              style={{ borderLeft: `3px solid ${color}` }}
```

---

### 2. Modal CSS Classes (`Projects.jsx`, `ProjectWorkspace.jsx`, `index.css`)

**Goal**: Replace all inline-style modal overlays and dialogs with `.modal-overlay` / `.modal-dialog` / `.modal-dialog--wide` classes.

#### CSS Changes (`index.css`)

New rules appended in a `/* ── Modals ── */` section:

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  background: var(--color-canvas-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  padding: var(--space-6);
}

.modal-dialog--wide {
  max-width: 560px;
}
```

#### JSX Changes (`Projects.jsx`)

Both the Create Project and Edit Project modals replace their inline-style `div` wrappers:

```jsx
/* Before */
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', ... }}>
  <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>

/* After */
<div className="modal-overlay">
  <div className="modal-dialog">
```

#### JSX Changes (`ProjectWorkspace.jsx`)

The New Task modal:

```jsx
/* Before */
<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', ... }} onClick={...}>
  <div className="glass-panel" style={{ width: '100%', maxWidth: '560px' }} onClick={...}>

/* After */
<div className="modal-overlay" onClick={() => setShowNewTaskModal(false)}>
  <div className="modal-dialog modal-dialog--wide" onClick={(event) => event.stopPropagation()}>
```

The `workspaceLoadError` banner:

```jsx
/* Before */
<div style={{ margin: '0 0 12px', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}>

/* After */
<div className="workspace-error-banner">
```

New CSS rule:
```css
.workspace-error-banner {
  margin: 0 0 12px;
  padding: 12px 14px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-default);
  background: var(--color-canvas-subtle);
  color: var(--color-fg-muted);
}
```

---

### 3. Dashboard Refactor (`Dashboard.jsx` + `index.css`)

**Goal**: Eliminate all hardcoded hex colors and inline styles from the lower sections of `Dashboard.jsx`. Every layout and color value moves to a CSS class using design tokens.

#### 3a. Page Title and Section Titles

New CSS rule:
```css
.dashboard-page-title {
  margin-bottom: 24px;
}
```

Ensure `.dashboard-section-title` (already exists) includes:
```css
.dashboard-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-3);
}
```

JSX: `<h2 style={{marginBottom: '24px'}}>` → `<h2 className="dashboard-page-title">`

Chart panel `<h3>` elements already carry `.dashboard-section-title`; remove any remaining inline styles.

#### 3b. Task Distribution Panel

New CSS classes:

```css
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
  font-size: var(--font-size-sm);
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

.dashboard-status-row--todo {
  background: rgba(110, 118, 129, 0.12);
}

.dashboard-status-row--todo .dashboard-status-dot {
  background: var(--color-fg-subtle);
}

.dashboard-status-row--todo .dashboard-status-value {
  color: var(--color-fg-subtle);
}

.dashboard-status-row--in-progress {
  background: rgba(210, 153, 34, 0.12);
}

.dashboard-status-row--in-progress .dashboard-status-dot {
  background: var(--color-attention-fg);
}

.dashboard-status-row--in-progress .dashboard-status-value {
  color: var(--color-attention-fg);
}

.dashboard-status-row--done {
  background: rgba(63, 185, 80, 0.12);
}

.dashboard-status-row--done .dashboard-status-dot {
  background: var(--color-success-fg);
}

.dashboard-status-row--done .dashboard-status-value {
  color: var(--color-success-fg);
}

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
  font-size: var(--font-size-2xl);
}

.dashboard-status-pct {
  font-size: var(--font-size-xs);
  color: var(--color-fg-muted);
  min-width: 36px;
  text-align: right;
}
```

JSX mapping (the existing `.map()` over status items):

```jsx
/* Before */
{[
  { label: 'To Do', value: todoCount, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  ...
].map(item => (
  <div key={item.label} style={{ display: 'flex', ..., background: item.bg }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, ... }} />
    <span style={{ flex: 1, ... }}>{item.label}</span>
    <span style={{ fontWeight: 'bold', fontSize: '20px', color: item.color }}>{item.value}</span>
    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', ... }}>{pct}%</span>
  </div>
))}

/* After */
{[
  { label: 'To Do', modifier: 'todo', value: todoCount },
  { label: 'In Progress', modifier: 'in-progress', value: inProgressCount },
  { label: 'Done', modifier: 'done', value: doneCount },
].map(item => (
  <div key={item.label} className={`dashboard-status-row dashboard-status-row--${item.modifier}`}>
    <div className="dashboard-status-dot" />
    <span className="dashboard-status-label">{item.label}</span>
    <span className="dashboard-status-value">{item.value}</span>
    <span className="dashboard-status-pct">
      {totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0}%
    </span>
  </div>
))}
```

#### 3c. Recent Tasks Section

New CSS classes:

```css
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
```

JSX: Replace the outer `<div style={{display:'flex', gap:'24px'}}>` with `<div className="dashboard-bottom-row">`, the left column `<div className="glass-panel" style={{flex:1}}>` with `<div className="glass-panel dashboard-recent-tasks">`, the task list container with `<div className="dashboard-task-list">`, and each project row `<div className="glass-panel" style={{...}}>` with `<div className="dashboard-task-item">`.

#### 3d. Activity Logs Section

New CSS classes:

```css
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

JSX: Replace the right column `<div style={{flex:1, display:'flex', flexDirection:'column', gap:'24px'}}>` with `<div className="dashboard-activity-col">`, the scroll container `<div style={{marginTop:'16px', maxHeight:'300px', overflowY:'auto'}}>` with `<div className="dashboard-activity-scroll">`, and each activity entry with the new class names.

---

### 4. Micro-Interactions (`index.css`)

**Goal**: Add `transition` and `:active` rules to all interactive elements so that hover/press feedback is smooth.

#### Changes to existing selectors

```css
/* .btn — add transition and :active */
.btn {
  /* existing rules ... */
  transition: background-color 0.15s ease;
}

.btn:active {
  transform: scale(0.97);
}

/* .project-card — transition already added in section 1 */

/* .project-card__open — add transition */
.project-card__open {
  transition: color 0.15s ease;
}

/* .project-sidebar__link, .project-sidebar__project — add transition */
.project-sidebar__link,
.project-sidebar__project {
  /* existing rules ... */
  transition: background-color 0.15s ease, color 0.15s ease;
}

/* .table-view__row — add transition */
.table-view__row {
  transition: background-color 0.15s ease;
}

/* .roadmap-task — already has transition: background-color 0.2s ease, border-color 0.2s ease; verify it's present */

/* .icon-button, .theme-toggle, .avatar-button — add transition */
.icon-button,
.theme-toggle,
.avatar-button {
  /* existing rules ... */
  transition: opacity 0.15s ease;
}
```

---

### 5. Login.jsx Cleanup (`Login.jsx` + `index.css`)

**Goal**: Remove the three remaining inline styles from `Login.jsx`.

#### CSS Changes (`index.css`)

```css
.auth-brand-row {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.auth-toggle-row {
  text-align: center;
  margin-top: 24px;
  font-size: var(--font-size-md);
}

/* .btn--full — add margin-top */
.btn--full {
  width: 100%;
  margin-top: 8px;
}

/* .auth-subtitle — ensure color is set */
.auth-subtitle {
  color: var(--color-fg-muted);
  text-align: center;
  margin-bottom: var(--space-4);
}
```

#### JSX Changes (`Login.jsx`)

```jsx
/* Before */
<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
  <button className="icon-button icon-button--brand auth-brand-icon" ...>

/* After */
<div className="auth-brand-row">
  <button className="icon-button icon-button--brand auth-brand-icon" ...>
```

```jsx
/* Before */
<h2 className="logo" style={{ textAlign: 'center', marginBottom: '8px' }}>

/* After */
<h2 className="logo auth-logo">
```

Add `.auth-logo { text-align: center; margin-bottom: 8px; }` to `index.css`.

```jsx
/* Before */
<button className="btn btn--primary btn--full" style={{ marginTop: '8px' }} ...>

/* After */
<button className="btn btn--primary btn--full" ...>
```

```jsx
/* Before */
<div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
  <span style={{ color: 'var(--color-fg-muted)' }}>...</span>

/* After */
<div className="auth-toggle-row">
  <span>...</span>
```

The `color: var(--color-fg-muted)` on the inner `<span>` is removed because `.auth-toggle-row` inherits `color` from `.auth-card` which uses `var(--color-fg-default)`. The muted color for the label text is applied via a new `.auth-toggle-row__label` class or by relying on the existing `color: var(--color-fg-muted)` on the parent `.auth-subtitle`. Since the toggle row text is a distinct element, add:

```css
.auth-toggle-row {
  color: var(--color-fg-muted);
  text-align: center;
  margin-top: 24px;
  font-size: var(--font-size-md);
}
```

This makes the inner `<span style={{ color: 'var(--color-fg-muted)' }}>` redundant and it can be removed.

---

## Data Models

No new data models. The only runtime-computed value is the project accent color:

```
projectIdToColor(project._id) → string (CSS color from PROJECT_COLOR_PALETTE)
```

This is a pure, deterministic function with no side effects. It is called during render in `Projects.jsx` and the result is applied as `borderLeft` inline style on the card container — the only permitted dynamic inline style in this feature.

---

## Error Handling

- **projectIdToColor with empty/null id**: The utility already guards against this — it returns `PROJECT_COLOR_PALETTE[0]` for falsy or empty ids. No additional error handling needed.
- **Modal close on overlay click**: `ProjectWorkspace.jsx` already calls `setShowNewTaskModal(false)` on overlay click and `event.stopPropagation()` on the dialog. This behavior is preserved when switching to `.modal-overlay` / `.modal-dialog`.
- **CSS class conflicts**: The new `.modal-dialog` class must not conflict with any existing `.glass-panel` usage. Since modals are migrated away from `.glass-panel`, there is no conflict.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: projectIdToColor always returns a palette member

*For any* non-empty string `id`, `projectIdToColor(id)` SHALL return a value that is strictly contained in `PROJECT_COLOR_PALETTE`.

**Validates: Requirements 1.2**

### Property 2: projectIdToColor is deterministic

*For any* string `id`, calling `projectIdToColor(id)` twice in succession SHALL return the same value both times (i.e. the function is pure and has no side effects).

**Validates: Requirements 1.2**

### Property 3: projectIdToColor handles edge-case ids without throwing

*For any* string `id` (including empty string, single character, very long strings, strings containing only digits, and strings containing Unicode characters), `projectIdToColor(id)` SHALL return a string without throwing an exception.

**Validates: Requirements 1.2**


---

## Testing Strategy

### Unit Tests (Example-Based)

The vast majority of acceptance criteria in this feature are structural checks — verifying that CSS classes are present, inline styles are absent, and correct class names are applied to rendered elements. These are best covered by example-based unit tests using Vitest + React Testing Library.

**Recommended test file**: `frontend/src/__tests__/github-ui-polish-v2.test.jsx`

Key scenarios to cover:
- Render a `Projects` component with mock data and assert `.project-card` is present, `.glass-panel` is absent on card containers, and `borderLeft` style is set.
- Render the Create/Edit Project modals and assert `.modal-overlay` and `.modal-dialog` class names are present with no `style` prop on those elements.
- Render the New Task modal in `ProjectWorkspace` and assert `.modal-overlay`, `.modal-dialog`, and `.modal-dialog--wide` are present.
- Render `Dashboard` and assert `.dashboard-page-title`, `.dashboard-distribution-panel`, `.dashboard-status-row--todo/in-progress/done`, `.dashboard-task-item`, `.dashboard-activity-item` classes are present.
- Render `Login` and assert `.auth-brand-row`, `.auth-toggle-row` are present with no inline `style` props on those elements.

### Property-Based Tests

The three correctness properties above (palette membership, determinism, edge-case safety) are implemented as property-based tests against the `projectIdToColor` pure function. Because this is a pure in-memory function, 100+ iterations are cheap and will surface edge cases that example tests miss.

**Recommended test file**: `frontend/src/__tests__/projectColor.property.test.js`

Use `fast-check` (already a common choice in JS ecosystems) or any PBT library available in the project:

```js
import fc from 'fast-check';
import { projectIdToColor, PROJECT_COLOR_PALETTE } from '../utils/projectColor';

// Property 1 & 2: palette membership + determinism
test('projectIdToColor always returns a palette member and is deterministic', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1 }), (id) => {
      const result = projectIdToColor(id);
      expect(PROJECT_COLOR_PALETTE).toContain(result);
      expect(projectIdToColor(id)).toBe(result); // determinism
    }),
    { numRuns: 200 }
  );
});

// Property 3: edge-case safety (includes empty string)
test('projectIdToColor never throws for any string input', () => {
  fc.assert(
    fc.property(fc.string(), (id) => {
      expect(() => projectIdToColor(id)).not.toThrow();
      const result = projectIdToColor(id);
      expect(typeof result).toBe('string');
    }),
    { numRuns: 200 }
  );
});
```

### Integration / Visual Tests

CSS hover states (`:hover`, `:active`, `transition`) cannot be verified by unit tests. These are validated manually or via visual regression tools (e.g. Chromatic, Percy) if the project adopts them in the future. The design document specifies the exact CSS values so manual verification is straightforward.
