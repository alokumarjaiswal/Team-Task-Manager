# Implementation Plan: GitHub UI Polish

## Overview

All changes are confined to the frontend. The work covers CSS token updates, new utility classes, a new pure utility function, and JSX refactors across four components. No backend changes are required.

## Tasks

- [x] 1. Update CSS design tokens for primary button color
  - [x] 1.1 Update `--color-btn-primary-bg` and `--color-btn-primary-hover-bg` in `github-tokens.css`
    - Change `--color-btn-primary-bg` from `#238636` to `var(--color-accent-emphasis)`
    - Change `--color-btn-primary-hover-bg` from `#2ea043` to `var(--color-accent-fg)`
    - Verify dark-mode block already defines `--color-accent-emphasis: #1f6feb` and `--color-accent-fg: #58a6ff`
    - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Add new CSS component classes to `index.css`
  - [x] 2.1 Add Dashboard stat card and grid classes
    - Add `.dashboard-stat-grid` with three-column grid and responsive single-column at ≤640 px
    - Add `.dashboard-stat-card`, `.dashboard-stat-card__body`, `.dashboard-stat-card__value`, `.dashboard-stat-card__label`
    - Add accent-strip variants: `.dashboard-stat-card--accent`, `.dashboard-stat-card--success`, `.dashboard-stat-card--attention`
    - Add `.dashboard-section-title` and `.dashboard-charts-grid`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 6.1, 6.2, 6.3, 6.4_

  - [x] 2.2 Add TopNav dropdown classes
    - Add `.avatar-dropdown`, `.avatar-dropdown__header`, `.avatar-dropdown__item`
    - Ensure `.avatar-dropdown__item` sets `color: var(--color-danger-fg)`
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 2.3 Add Login / Auth classes
    - Add `.btn--full` (width 100%, padding 12px)
    - Add `.auth-toggle-link` (color: var(--color-accent-fg))
    - Add `.auth-brand-icon` (48px × 48px, border-radius 50%)
    - Add `.auth-subtitle` (color: var(--color-fg-muted))
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [x] 2.4 Add transition and disabled-state rules
    - Append `transition: background-color 0.15s ease` to `.btn` and `.btn--primary`
    - Add `.btn:disabled, .btn--primary:disabled` with `opacity: 0.6` and `cursor: not-allowed`
    - Add `transition: background-color 0.15s ease` to `.project-sidebar__link` and `.project-sidebar__project`
    - _Requirements: 9.2, 9.4_

- [x] 3. Create `projectColor.js` utility
  - [x] 3.1 Implement `projectIdToColor` pure function in `frontend/src/utils/projectColor.js`
    - Export `PROJECT_COLOR_PALETTE` array with 8 distinct hex colors (none equal to `#6e7681`)
    - Implement `projectIdToColor(id)` using char-code sum modulo palette length
    - Handle null/undefined/empty input by returning `PROJECT_COLOR_PALETTE[0]`
    - _Requirements: 4.2, 4.5_

  - [ ]* 3.2 Write property tests for `projectIdToColor` (Property 2)
    - **Property 2a: Determinism** — same `id` always returns same color
    - **Property 2b: Palette membership** — result is always a member of `PROJECT_COLOR_PALETTE`
    - **Property 2c: Forbidden color exclusion** — result never equals `'var(--color-fg-subtle)'` or `'#6e7681'`
    - Use `fast-check` with `numRuns: 1000`; place in `frontend/src/utils/projectColor.property.test.js`
    - **Validates: Requirements 4.2, 4.5**

- [x] 4. Refactor `ProjectSidebar.jsx` — icons and color dots
  - [x] 4.1 Add Lucide icons to sidebar navigation items
    - Import `LayoutDashboard`, `FolderKanban`, `CheckSquare`, `Users` from `lucide-react`
    - Add `Icon` field to `navItems` array for each of the four nav entries
    - Render each icon at `size={16}` with `aria-hidden="true"` before the label span
    - Apply `color: var(--color-accent-fg)` when active, `color: var(--color-fg-muted)` when inactive via inline style on the icon
    - Remove any existing `.project-sidebar__dot` placeholder elements from nav items
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.2 Add project color dots to sidebar project list
    - Import `projectIdToColor` from `../../utils/projectColor`
    - For each project in the list, compute `dotColor = projectIdToColor(project._id)`
    - Render `<span className="project-sidebar__project-dot" aria-hidden="true" style={{ background: dotColor }} />` before the project name
    - Ensure the dot is retained unchanged when the project link is active
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [ ]* 4.3 Write property tests for ProjectSidebar dot rendering (Property 1 & 3)
    - **Property 1:** For any non-empty array of project objects, every rendered project link contains exactly one `.project-sidebar__project-dot` element
    - **Property 3:** For any project with a non-empty `_id`, the dot's `background` style equals `projectIdToColor(project._id)`
    - Use `fast-check` with `fc.array(fc.record({ _id: fc.string({ minLength: 1 }), name: fc.string({ minLength: 1 }) }))`
    - Place in `frontend/src/components/layout/ProjectSidebar.property.test.jsx`
    - **Validates: Requirements 4.1, 4.3**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Refactor `TopNav.jsx` — remove dropdown inline styles
  - [x] 6.1 Replace inline styles on dropdown elements with CSS classes
    - Remove `style={{ … }}` from the dropdown container `<div>` and replace with `className="avatar-dropdown"`
    - Remove `style={{ … }}` from the dropdown header `<div>` and replace with `className="avatar-dropdown__header"`
    - Remove `style={{ … }}` from the logout `<button>` and replace with `className="avatar-dropdown__item"`
    - Retain `ref={menuRef}` and the relative-positioned wrapper unchanged
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.2 Write unit tests for TopNav dropdown class usage
    - Render `TopNav` with dropdown open; assert `.avatar-dropdown`, `.avatar-dropdown__header`, `.avatar-dropdown__item` classes are present
    - Assert no `style` prop on the dropdown container, header, or logout button elements
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Refactor `Dashboard.jsx` — stat card redesign and class migration
  - [x] 7.1 Redesign stat cards and migrate layout to CSS classes
    - Replace stat card container inline grid style with `className="dashboard-stat-grid"`
    - Replace each `<div className="glass-panel">` with `<div className="dashboard-stat-card dashboard-stat-card--{variant}">`
    - Structure each card body with `.dashboard-stat-card__body`, `.dashboard-stat-card__value`, `.dashboard-stat-card__label`
    - Import `AlertCircle`, `CheckCircle`, `Clock` from `lucide-react`; render each at `size={16}` on the right side with the matching color token
    - Remove 32 px icons and `.glass-panel` usage from stat cards
    - Replace chart section `<h3 style={{…}}>` with `<h3 className="dashboard-section-title">`
    - Replace charts container `<div style={{…}}>` with `<div className="dashboard-charts-grid">`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write unit tests for Dashboard stat card rendering
    - Assert `.glass-panel` is absent from stat card section
    - Assert three `.dashboard-stat-card` elements are present
    - Assert each card contains a 16 px icon and no 32 px icon
    - Assert `.dashboard-stat-grid`, `.dashboard-charts-grid`, `.dashboard-section-title` classes are present
    - _Requirements: 2.1, 2.5, 2.6, 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Refactor `Login.jsx` — class migration
  - [x] 8.1 Replace inline styles in Login component with CSS classes
    - Add `.btn--primary` and `.btn--full` to the submit button; remove its inline `style` prop
    - Replace GitHubMark icon button inline `style` with `className="auth-brand-icon"` (alongside existing classes)
    - Replace subtitle `<p>` inline `style` with `className="auth-subtitle"`
    - Replace toggle `<span>` inline `style` with `className="auth-toggle-link"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.2 Write unit tests for Login class usage
    - Assert submit button has both `.btn--primary` and `.btn--full` classes
    - Assert `.auth-brand-icon`, `.auth-subtitle`, `.auth-toggle-link` classes are present
    - Assert no inline `style` prop on the submit button, brand icon, subtitle, or toggle link
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `Landing.jsx` requires no changes — all Requirement 7 criteria are already satisfied by existing CSS
- The icon color on sidebar nav items uses a single inline `style` prop because the value is dynamic (depends on `active` boolean at render time); this does not violate Requirement 5, which targets the TopNav dropdown specifically
- Property tests use `fast-check` which is compatible with Vitest; install with `npm install --save-dev fast-check` in the frontend directory if not already present
- Each task references specific requirements for traceability

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2", "2.3", "2.4", "3.1"] },
    { "id": 1, "tasks": ["3.2", "4.1", "4.2", "6.1", "7.1", "8.1"] },
    { "id": 2, "tasks": ["4.3", "6.2", "7.2", "8.2"] }
  ]
}
```
