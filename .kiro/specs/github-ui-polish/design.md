# Design Document — GitHub UI Polish

## Overview

This document describes the technical architecture for the GitHub UI/UX polish pass. All changes are confined to the frontend. No backend routes, models, or APIs are modified. The work falls into three categories:

1. **CSS-only changes** — new token values and new utility/component classes in `github-tokens.css` and `index.css`.
2. **JSX refactors** — replacing inline `style` props with CSS classes and adding new elements (icons, color dots) in `ProjectSidebar.jsx`, `TopNav.jsx`, `Dashboard.jsx`, and `Login.jsx`.
3. **Pure-function addition** — a deterministic `projectIdToColor` utility used by `ProjectSidebar.jsx`.

`Landing.jsx` requires no JSX changes; its requirements are already satisfied by existing CSS rules.

---

## Architecture

```
frontend/src/
├── styles/
│   └── github-tokens.css        ← token value changes (Req 1)
├── index.css                    ← new component classes (Req 2, 5, 6, 8, 9)
├── utils/
│   └── projectColor.js          ← new pure utility (Req 4)
└── components/
    ├── layout/
    │   ├── ProjectSidebar.jsx   ← icons + color dots (Req 3, 4)
    │   └── TopNav.jsx           ← dropdown class migration (Req 5)
    └── Login.jsx                ← class migration (Req 8)
pages/
└── Dashboard.jsx                ← stat card redesign + class migration (Req 2, 6)
```

---

## File-by-File Changes

### 1. `frontend/src/styles/github-tokens.css`

**What changes:** Two token values in the `:root` block.

| Token | Old value | New value |
|---|---|---|
| `--color-btn-primary-bg` | `#238636` | `var(--color-accent-emphasis)` |
| `--color-btn-primary-hover-bg` | `#2ea043` | `var(--color-accent-fg)` |

The `.dark` block already defines `--color-accent-emphasis: #1f6feb` and `--color-accent-fg: #58a6ff`, so dark-mode resolution is automatic. No other token values change.

```css
/* :root — updated values */
--color-btn-primary-bg: var(--color-accent-emphasis);   /* #0969da light */
--color-btn-primary-hover-bg: var(--color-accent-fg);   /* #0366d6 light */
```

---

### 2. `frontend/src/index.css`

**What changes:** New CSS classes are appended. No existing rules are removed or modified.

#### 2a. Dashboard stat card classes (Req 2, 6)

```css
/* Stat card grid */
.dashboard-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: 32px;
}

@media (max-width: 640px) {
  .dashboard-stat-grid {
    grid-template-columns: 1fr;
  }
}

/* Individual stat card */
.dashboard-stat-card {
  background: var(--color-canvas-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-sm);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  border-left-width: 4px;
}

.dashboard-stat-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard-stat-card__value {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  line-height: 1;
}

.dashboard-stat-card__label {
  font-size: var(--font-size-sm);
  color: var(--color-fg-muted);
}

/* Accent strip color variants */
.dashboard-stat-card--accent {
  border-left-color: var(--color-accent-emphasis);
}
.dashboard-stat-card--success {
  border-left-color: var(--color-success-emphasis);
}
.dashboard-stat-card--attention {
  border-left-color: var(--color-attention-fg);
}

/* Dashboard layout helpers */
.dashboard-section-title {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}
```

#### 2b. TopNav dropdown classes (Req 5)

```css
.avatar-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 100;
  overflow: hidden;
}

.avatar-dropdown__header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--card-border);
  font-size: 13px;
  font-weight: 600;
}

.avatar-dropdown__item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-danger-fg);
}

.avatar-dropdown__item:hover {
  background: rgba(110, 118, 129, 0.08);
}
```

#### 2c. Login / Auth classes (Req 8)

```css
.btn--full {
  width: 100%;
  padding: 12px;
}

.auth-toggle-link {
  color: var(--color-accent-fg);
  cursor: pointer;
  font-weight: 500;
}

.auth-brand-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.auth-subtitle {
  text-align: center;
  color: var(--color-fg-muted);
  margin-bottom: 24px;
}
```

#### 2d. Transition additions (Req 9)

```css
/* Append to existing .btn and .btn--primary rules */
.btn,
.btn--primary {
  transition: background-color 0.15s ease;
}

.btn:disabled,
.btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.project-sidebar__link,
.project-sidebar__project {
  transition: background-color 0.15s ease;
}
```

---

### 3. `frontend/src/utils/projectColor.js` (new file)

This is the only new JavaScript file. It exports a single pure function.

**Algorithm — deterministic color derivation from project `_id`:**

MongoDB ObjectIds are 24-character hex strings. The algorithm sums the char codes of all characters in the id string, then takes the result modulo the palette length to select a color. This is O(n) in id length, produces no collisions within the palette, and is fully deterministic.

```js
/**
 * Derives a deterministic color for a project from its _id string.
 *
 * @param {string} id - The project's _id (any non-empty string).
 * @returns {string} A CSS color value from PROJECT_COLOR_PALETTE.
 */

export const PROJECT_COLOR_PALETTE = [
  '#58a6ff', // blue   — var(--color-accent-fg) light
  '#3fb950', // green  — var(--color-success-fg) dark
  '#d29922', // yellow — var(--color-attention-fg)
  '#a371f7', // purple — var(--color-done-fg)
  '#f78166', // coral  — warm accent
  '#79c0ff', // sky    — lighter blue
  '#56d364', // mint   — lighter green
  '#e3b341', // amber  — lighter yellow
];

export function projectIdToColor(id) {
  if (!id || id.length === 0) return PROJECT_COLOR_PALETTE[0];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return PROJECT_COLOR_PALETTE[sum % PROJECT_COLOR_PALETTE.length];
}
```

**Properties of this algorithm:**
- **Deterministic**: same `id` → same `sum` → same index → same color, always.
- **Stable under palette growth**: adding colors at the end changes assignments for some ids, but the function remains deterministic.
- **No forbidden color**: `var(--color-fg-subtle)` (`#6e7681`) is not in the palette.
- **Palette size ≥ 6**: 8 colors satisfy the requirement of at least six distinct tokens.

---

### 4. `frontend/src/components/layout/ProjectSidebar.jsx`

**What changes:**

1. Import `LayoutDashboard`, `FolderKanban`, `CheckSquare`, `Users` from `lucide-react`.
2. Import `projectIdToColor` from `../../utils/projectColor`.
3. Update `navItems` array to include an `icon` field.
4. Replace `<span className="project-sidebar__dot" />` in nav items with the icon component.
5. Apply `color` style to icon based on active state (muted when inactive, accent when active).
6. Replace `<span className="project-sidebar__project-dot" />` with a dot whose `background` is set to `projectIdToColor(project._id)`.

```jsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users } from 'lucide-react';
import { projectIdToColor } from '../../utils/projectColor';

const navItems = [
  { path: '/',         label: 'Overview',   Icon: LayoutDashboard },
  { path: '/projects', label: 'Projects',   Icon: FolderKanban    },
  { path: '/tasks',    label: 'Task Board', Icon: CheckSquare     },
  { path: '/team',     label: 'Team',       Icon: Users           },
];

export default function ProjectSidebar({ projects = [] }) {
  const location = useLocation();

  return (
    <aside className="project-sidebar" aria-label="Project navigation">
      <div className="project-sidebar__section">
        <div className="project-sidebar__heading">Projects</div>
        <nav className="project-sidebar__nav">
          {navItems.map(({ path, label, Icon }) => {
            const active =
              location.pathname === path ||
              location.pathname.startsWith(`${path}/`);
            return (
              <Link
                key={path}
                to={path}
                className={active ? 'project-sidebar__link is-active' : 'project-sidebar__link'}
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                  style={{ color: active ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)' }}
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
            const active =
              location.pathname === `/projects/${project._id}` ||
              location.pathname.startsWith(`/projects/${project._id}/`);
            const dotColor = projectIdToColor(project._id);
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className={active ? 'project-sidebar__project is-active' : 'project-sidebar__project'}
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
```

**Note on the icon color style:** The two icon color values (`var(--color-accent-fg)` and `var(--color-fg-muted)`) are dynamic — they depend on the `active` boolean computed at render time. A single inline `style` prop on the icon is the correct React pattern here; it does not violate Requirement 5 (which targets the TopNav dropdown container, header, and logout button specifically).

---

### 5. `frontend/src/components/layout/TopNav.jsx`

**What changes:** Remove all `style={{ … }}` props from the dropdown container, dropdown header div, and logout button. Replace with the three new CSS classes.

```jsx
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
```

The `ref={menuRef}` and `style={{ position: 'relative' }}` on the wrapper `<div>` are retained — the relative positioning on the wrapper is structural (not part of the dropdown itself) and is acceptable. Alternatively it can be moved to a `.avatar-menu-wrapper` class if strict inline-style elimination is desired.

---

### 6. `frontend/src/pages/Dashboard.jsx`

**What changes:**

1. Replace the stat card container `<div>` inline grid style with `className="dashboard-stat-grid"`.
2. Replace each stat card `<div className="glass-panel">` with `<div className="dashboard-stat-card dashboard-stat-card--{variant}">`.
3. Move metric value and label into `.dashboard-stat-card__body`. Move icon to the right side.
4. Replace chart section `<h3 style={{...}}>` with `<h3 className="dashboard-section-title">`.
5. Replace charts container `<div style={{...}}>` with `<div className="dashboard-charts-grid">`.
6. Remove 32 px icons from stat cards; use 16 px icons aligned right.

**Stat card structure (per card):**

```jsx
<div className="dashboard-stat-card dashboard-stat-card--accent">
  <div className="dashboard-stat-card__body">
    <div className="dashboard-stat-card__value">{totalTasks}</div>
    <div className="dashboard-stat-card__label">Total Tasks</div>
  </div>
  <AlertCircle size={16} color="var(--color-accent-emphasis)" aria-hidden="true" />
</div>
```

The three variants map as:
- Total Tasks → `dashboard-stat-card--accent` / `--color-accent-emphasis` / `AlertCircle`
- Completed → `dashboard-stat-card--success` / `--color-success-emphasis` / `CheckCircle`
- In Progress → `dashboard-stat-card--attention` / `--color-attention-fg` / `Clock`

---

### 7. `frontend/src/components/Login.jsx`

**What changes:**

1. Add `.btn--primary` and `.btn--full` classes to the submit button; remove inline `style` prop.
2. Replace the GitHubMark icon button inline `style` with `className="auth-brand-icon"` (added alongside existing `icon-button icon-button--brand`).
3. Replace the subtitle `<p>` inline `style` with `className="auth-subtitle"`.
4. Replace the toggle `<span>` inline `style` with `className="auth-toggle-link"`.
5. Wrap the toggle text container in a `<p>` with `className="auth-toggle"` for semantic correctness.

```jsx
{/* Brand icon — before */}
<button className="icon-button icon-button--brand auth-brand-icon" type="button" aria-label="GitHub home">
  <GitHubMark width="22" height="22" />
</button>

{/* Subtitle — before */}
<p className="auth-subtitle">
  {isLogin ? 'Welcome back to your workspace' : 'Create your workspace account'}
</p>

{/* Submit button — before */}
<button className="btn btn--primary btn--full" disabled={loading}>
  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
</button>

{/* Toggle link — before */}
<span className="auth-toggle-link" onClick={() => setIsLogin(!isLogin)}>
  {isLogin ? 'Sign up' : 'Log in'}
</span>
```

---

### 8. `frontend/src/pages/Landing.jsx`

No JSX changes required. All requirements for this file (7.1–7.6) are already satisfied by existing CSS rules in `index.css`. The board preview column status dots already use `style={{ background: column.color }}` with the correct color values from the `boardPreview` data array. This is a data-driven inline style (not a hardcoded style), which is the correct pattern for dynamic colors.

---

## Components and Interfaces

### `projectIdToColor(id: string): string`

Located in `frontend/src/utils/projectColor.js`.

- **Input**: any string (project `_id`). Handles `null`/`undefined`/empty by returning `PROJECT_COLOR_PALETTE[0]`.
- **Output**: a CSS color string, always a member of `PROJECT_COLOR_PALETTE`.
- **Side effects**: none. Pure function.

### `PROJECT_COLOR_PALETTE: string[]`

Exported constant from the same file. An ordered array of 8 CSS hex color strings. Consumers may import it to enumerate valid colors (e.g., in tests).

### `ProjectSidebar({ projects: Project[] })`

Props unchanged. Internally imports `projectIdToColor` and the four Lucide icons. No new props are added.

### `TopNav({ user, onLogout, onToggleTheme, themeLabel, darkMode, onCreate })`

Props unchanged. The dropdown rendering switches from inline styles to CSS classes.

### `DashboardHome()`

No prop changes. Internal rendering restructured to use new CSS classes.

### `Login({ setUser })`

No prop changes. Internal rendering restructured to use new CSS classes.

---

## Data Models

No new data models. The `project._id` field (existing MongoDB ObjectId string) is the sole input to `projectIdToColor`. No schema changes.

---

## Error Handling

- `projectIdToColor` handles `null`, `undefined`, and empty string inputs by returning `PROJECT_COLOR_PALETTE[0]` (blue). This prevents rendering errors if a project has a missing or malformed `_id`.
- All other changes are purely presentational; no new async operations or error paths are introduced.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Project color dot is always rendered for every project

*For any* non-empty array of project objects passed to `ProjectSidebar`, every rendered project link SHALL contain exactly one element with the `project-sidebar__project-dot` class.

**Validates: Requirements 4.1**

---

### Property 2: Color derivation is deterministic and palette-bounded

*For any* non-empty string `id`, `projectIdToColor(id)` SHALL always return the same value on repeated calls (determinism), and that value SHALL always be a member of `PROJECT_COLOR_PALETTE` (range invariant). The returned value SHALL never equal `'var(--color-fg-subtle)'` or its resolved hex `#6e7681` (forbidden color exclusion).

**Validates: Requirements 4.2, 4.5**

---

### Property 3: Rendered dot background matches derived color

*For any* project object with a non-empty `_id`, the `background` style of the rendered `project-sidebar__project-dot` element SHALL equal `projectIdToColor(project._id)`.

**Validates: Requirements 4.3**

---

## Testing Strategy

### Unit / Example Tests

The majority of requirements are specific rendering checks best covered by example-based tests using Vitest + React Testing Library:

- **Req 1**: Assert `.btn--primary` computed background is `#0969da` (light) and `#1f6feb` (dark).
- **Req 2**: Snapshot test for `DashboardHome` stat card section; assert `.glass-panel` is absent, `.dashboard-stat-card` is present, icon size is 16.
- **Req 3**: Render `ProjectSidebar` and assert each nav item contains the correct Lucide icon component; assert `.project-sidebar__dot` is absent from nav items.
- **Req 5**: Render `TopNav` with `open=true`; assert `.avatar-dropdown`, `.avatar-dropdown__header`, `.avatar-dropdown__item` classes are present; assert no `style` prop on those elements.
- **Req 6**: Snapshot test for `DashboardHome`; assert `.dashboard-stat-grid`, `.dashboard-charts-grid`, `.dashboard-section-title` classes are present.
- **Req 8**: Render `Login`; assert submit button has `.btn--primary .btn--full`; assert `.auth-brand-icon`, `.auth-subtitle`, `.auth-toggle-link` classes are present.
- **Req 9**: Assert `.btn--primary[disabled]` has `opacity: 0.6` and `cursor: not-allowed`.

### Property-Based Tests

Property tests use **fast-check** (already compatible with Vitest) targeting the pure `projectIdToColor` function:

```js
// projectColor.property.test.js
import fc from 'fast-check';
import { projectIdToColor, PROJECT_COLOR_PALETTE } from '../utils/projectColor';

// Property 2: determinism
test('Property 2a: same id always returns same color', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1 }), (id) => {
      return projectIdToColor(id) === projectIdToColor(id);
    }),
    { numRuns: 1000 }
  );
});

// Property 2: palette membership
test('Property 2b: result is always a palette member', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1 }), (id) => {
      return PROJECT_COLOR_PALETTE.includes(projectIdToColor(id));
    }),
    { numRuns: 1000 }
  );
});

// Property 2: forbidden color exclusion
test('Property 2c: result never equals forbidden color', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1 }), (id) => {
      const color = projectIdToColor(id);
      return color !== 'var(--color-fg-subtle)' && color !== '#6e7681';
    }),
    { numRuns: 1000 }
  );
});
```

Properties 1 and 3 require a rendered DOM and are tested with React Testing Library using `fc.array(fc.record({ _id: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }) }))` to generate random project arrays.

**Tag format:** `Feature: github-ui-polish, Property {N}: {property_text}`
