# Requirements Document

## Introduction

This feature delivers a comprehensive third-pass GitHub-quality UI/UX overhaul of the Team Task Manager frontend, building on the `github-ui-polish` and `github-ui-polish-v2` specs. The scope covers twelve distinct surfaces: (1) complete CSS class migration for `FilterBar.jsx` dropdown menus and toolbar buttons, (2) complete CSS class migration and dark-mode fix for `Team.jsx`, (3) removal of the legacy `TaskBoard.jsx` page and its route, (4) inline style removal in `TableView.jsx` group headers, (5) form label inline style removal in `TaskDetailPanel.jsx`, (6) inline style removal in `ProjectHeader.jsx`, (7) dark-mode text token fix in `Landing.jsx`, (8) hamburger mobile sidebar toggle in `AppShell.jsx` / `TopNav.jsx`, (9) label container inline style removal in `BoardCard.jsx`, (10) a global `.btn` hover fix for light mode, (11) consistent heading font-weight in the global reset, and (12) the remaining lower-section inline style refactor in `Dashboard.jsx`. No backend changes are in scope.

---

## Glossary

- **Design System**: The set of CSS custom properties defined in `github-tokens.css` and utility classes in `index.css`.
- **Color Token**: A CSS custom property defined in `github-tokens.css` (e.g. `--color-canvas-subtle`, `--color-border-default`).
- **Inline Style**: A `style={{ … }}` prop applied directly to a JSX element rather than via a CSS class.
- **Filter Popover**: The dropdown panel rendered by `FilterBar.jsx` when a toolbar button (Labels, Milestones, Group by, Sort, Fields, View options) is clicked.
- **FilterBar**: The React component at `frontend/src/components/project/FilterBar.jsx`.
- **Team.jsx**: The React component at `frontend/src/pages/Team.jsx`.
- **TaskBoard.jsx**: The legacy React component at `frontend/src/pages/TaskBoard.jsx`.
- **TableView.jsx**: The React component at `frontend/src/components/table/TableView.jsx`.
- **TaskDetailPanel.jsx**: The React component at `frontend/src/components/task/TaskDetailPanel.jsx`.
- **ProjectHeader.jsx**: The React component at `frontend/src/components/project/ProjectHeader.jsx`.
- **Landing.jsx**: The React component at `frontend/src/pages/Landing.jsx`.
- **AppShell.jsx**: The React component at `frontend/src/components/layout/AppShell.jsx`.
- **TopNav.jsx**: The React component at `frontend/src/components/layout/TopNav.jsx`.
- **ProjectSidebar.jsx**: The React component at `frontend/src/components/layout/ProjectSidebar.jsx`.
- **BoardCard.jsx**: The React component at `frontend/src/components/board/BoardCard.jsx`.
- **Dashboard.jsx**: The React component at `frontend/src/pages/Dashboard.jsx`.
- **App.jsx**: The React component at `frontend/src/App.jsx`.
- **Hamburger Button**: A button in the TopNav that toggles sidebar visibility on mobile viewports (≤800 px).
- **Mobile Sidebar**: The `<aside>` element rendered by `ProjectSidebar.jsx` when the viewport width is 800 px or narrower.
- **Task Distribution Panel**: The `glass-panel` section in `Dashboard.jsx` containing the status breakdown list and the donut `PieChart`.
- **Recent Tasks Section**: The left column in the bottom row of `Dashboard.jsx` listing projects with task counts.
- **Activity Logs Section**: The right column in the bottom row of `Dashboard.jsx` listing recent activity entries.

---

## Requirements

### Requirement 1 — FilterBar Dropdown CSS Class Migration

**User Story:** As a developer, I want all dropdown menus and toolbar buttons in `FilterBar.jsx` to use CSS classes instead of inline styles so that the filter bar is fully themeable and dark-mode compatible.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.filter-popover` that applies `position: absolute`, `top: 52px`, `left: 0`, `min-width: 280px`, `max-width: 360px`, `background: var(--color-canvas-default)`, `border: 1px solid var(--color-border-default)`, `border-radius: 6px`, `box-shadow: 0 8px 24px rgba(140,149,159,0.2)`, `padding: 12px`, and `z-index: 20` — with no `backdrop-filter` or blur.
2. THE Design System SHALL define a CSS class `.filter-popover__list` that applies `display: grid`, `gap: 8px`, and `margin-top: 10px` to the option list container inside each Filter Popover.
3. THE Design System SHALL define a CSS class `.filter-popover__option` that applies `display: flex`, `width: 100%`, `justify-content: space-between`, `align-items: center`, `gap: 12px`, `padding: 8px 10px`, `border-radius: var(--border-radius-sm)`, `border: 1px solid var(--color-border-default)`, `background: transparent`, and `cursor: pointer` to each option button.
4. THE Design System SHALL define a modifier class `.filter-popover__option--active` that overrides the border to `1px solid var(--color-accent-emphasis)` and the background to `rgba(88, 166, 255, 0.12)` when an option is selected.
5. THE Design System SHALL define a CSS class `.filter-popover__hint` that applies `font-size: var(--font-size-sm)` and `color: var(--color-fg-muted)` to the descriptive hint text inside a Filter Popover.
6. THE Design System SHALL define a CSS class `.filter-popover__footer` that applies `display: flex`, `justify-content: space-between`, `gap: 8px`, and `margin-top: 12px` to the footer action row inside a Filter Popover.
7. THE FilterBar.jsx component SHALL render each Filter Popover container with the `.filter-popover` class and SHALL NOT contain any Inline Style on those container elements.
8. THE FilterBar.jsx component SHALL render each option button with `.filter-popover__option` and, when active, additionally `.filter-popover__option--active`, and SHALL NOT contain any Inline Style on those button elements.
9. THE FilterBar.jsx component SHALL render the option list container with `.filter-popover__list` and SHALL NOT contain any Inline Style on those list container elements.
10. THE FilterBar.jsx component SHALL render the hint text elements with `.filter-popover__hint` and SHALL NOT contain any Inline Style on those elements.
11. THE FilterBar.jsx component SHALL render the footer action rows with `.filter-popover__footer` and SHALL NOT contain any Inline Style on those elements.
12. THE FilterBar.jsx `filter-bar__actions` wrapper `<div>` SHALL use `position: relative` via a CSS rule on `.filter-bar__actions` rather than an Inline Style.
13. WHEN a toolbar button has an active filter count greater than zero, THE FilterBar.jsx SHALL render the count badge using a CSS class `.filter-bar__count-badge` rather than an Inline Style.

---

### Requirement 2 — Team.jsx CSS Class Migration and Dark Mode Fix

**User Story:** As a user, I want the Team page to use CSS classes and color tokens for all member cards, avatars, role badges, delete buttons, and the Add Member modal so that the page renders correctly in both light and dark mode.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.team-page` that applies `display: flex` and `flex-direction: column` to the Team page root container.
2. THE Design System SHALL define a CSS class `.team-grid` that applies `display: grid`, `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, and `gap: 20px` to the member card grid container.
3. THE Design System SHALL define a CSS class `.team-card` that applies `display: flex`, `flex-direction: column`, `align-items: center`, `text-align: center`, and `position: relative` to each member card, replacing the Inline Style on those elements.
4. THE Design System SHALL define a CSS class `.team-avatar` that applies `width: 64px`, `height: 64px`, `border-radius: 50%`, `background: var(--color-accent-emphasis)`, `display: flex`, `justify-content: center`, `align-items: center`, `margin-bottom: 16px`, `font-size: 24px`, `font-weight: bold`, and `color: var(--color-fg-on-emphasis)` to the avatar circle element.
5. THE Design System SHALL define a modifier class `.team-avatar--admin` that overrides the avatar background to `linear-gradient(135deg, var(--color-attention-fg), var(--color-accent-emphasis))`.
6. THE Design System SHALL define a CSS class `.team-role-badge` that applies `display: inline-flex`, `align-items: center`, `gap: 6px`, `font-size: var(--font-size-sm)`, `font-weight: 600`, `margin-top: 8px`, `padding: 4px 12px`, and `border-radius: 20px` to the role badge element.
7. THE Design System SHALL define a modifier class `.team-role-badge--admin` that applies `color: var(--color-attention-fg)` and `background: rgba(210, 153, 34, 0.12)` to the admin role badge.
8. THE Design System SHALL define a modifier class `.team-role-badge--member` that applies `color: var(--color-fg-default)` and `background: var(--color-canvas-inset)` to the member role badge.
9. THE Design System SHALL define a CSS class `.team-delete-btn` that applies `position: absolute`, `top: 12px`, `right: 12px`, `background: var(--color-danger-emphasis)`, `color: var(--color-fg-on-emphasis)`, `border: none`, `border-radius: var(--border-radius-sm)`, `padding: 6px 8px`, `cursor: pointer`, `display: flex`, `align-items: center`, `gap: 4px`, `font-size: var(--font-size-sm)`, `font-weight: 500`, and `transition: opacity 0.2s` to the delete button.
10. THE Design System SHALL define a CSS class `.team-email-row` that applies `display: flex`, `align-items: center`, `gap: 6px`, `color: var(--color-fg-muted)`, `font-size: var(--font-size-md)`, and `margin-bottom: 8px` to the email display row.
11. THE Design System SHALL define a CSS class `.team-you-badge` that applies `font-size: var(--font-size-xs)` and `color: var(--color-success-fg)` to the "(You)" indicator span.
12. THE Team.jsx component SHALL render the page root with `.team-page`, the grid with `.team-grid`, each card with `.team-card glass-panel`, the avatar with `.team-avatar` (plus `.team-avatar--admin` when `u.role === 'admin'`), the role badge with `.team-role-badge` plus the appropriate modifier, the delete button with `.team-delete-btn`, and the email row with `.team-email-row` — and SHALL NOT contain any Inline Style on those elements.
13. THE Team.jsx Add Member modal overlay SHALL carry the `.modal-overlay` class (defined in the v2 spec) and SHALL NOT contain any Inline Style on that element.
14. THE Team.jsx Add Member modal dialog SHALL carry the `.modal-dialog` class (defined in the v2 spec) and SHALL NOT contain any Inline Style on that element.
15. THE Team.jsx modal close button SHALL NOT contain any Inline Style; its positioning SHALL be expressed via a CSS class `.modal-close-btn`.
16. THE Design System SHALL define `.modal-close-btn` with `position: absolute`, `top: 16px`, `right: 16px`, `background: transparent`, `border: none`, `cursor: pointer`, and `color: var(--color-fg-muted)`.

---

### Requirement 3 — TaskBoard.jsx Removal

**User Story:** As a developer, I want the legacy `TaskBoard.jsx` page and its route removed so that the codebase no longer contains a duplicate board implementation.

#### Acceptance Criteria

1. THE file `frontend/src/pages/TaskBoard.jsx` SHALL be deleted from the repository.
2. THE App.jsx component SHALL NOT import `TaskBoard` or reference the `TaskBoard` component after this change.
3. THE App.jsx component SHALL NOT define a route with `path="tasks"` that renders `<TaskBoard />` after this change.
4. WHEN a user navigates to `/tasks`, THE application SHALL redirect to `/projects` via a `<Navigate to="/projects" />` element or equivalent redirect route.
5. THE `ProjectSidebar.jsx` "Task Board" navigation item SHALL remain in the sidebar and SHALL navigate to `/tasks`, which SHALL redirect to `/projects` per criterion 4.

---

### Requirement 4 — TableView.jsx Group Header Inline Style Removal

**User Story:** As a developer, I want the group header row in `TableView.jsx` to use CSS classes instead of inline styles so that the table is fully themeable and dark-mode compatible.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.table-view__group-header` that applies `padding: 12px 14px`, `font-weight: 600`, `background: var(--color-canvas-subtle)`, and `border-top: 1px solid var(--color-border-default)` to the group header `<td>` element.
2. THE Design System SHALL define a CSS class `.table-view__group-label` that applies `display: inline-flex`, `align-items: center`, and `gap: 8px` to the label `<span>` inside the group header cell.
3. THE Design System SHALL define a CSS class `.table-view__group-dot` that applies `width: 10px`, `height: 10px`, `border-radius: 999px`, and `flex-shrink: 0` to the color dot `<span>` inside the group label.
4. THE Design System SHALL define a CSS class `.table-view__group-count` that applies `opacity: 0.7` to the task count `<span>` inside the group label.
5. THE TableView.jsx group header `<td>` element SHALL carry the `.table-view__group-header` class and SHALL NOT contain any Inline Style.
6. THE TableView.jsx group label `<span>` element SHALL carry the `.table-view__group-label` class and SHALL NOT contain any Inline Style.
7. THE TableView.jsx group dot `<span>` element SHALL carry the `.table-view__group-dot` class; the `background` color SHALL be applied via an Inline Style only for the dynamic `group.accent` value, as it is data-driven and cannot be expressed as a static CSS class.

---

### Requirement 5 — TaskDetailPanel.jsx Form Label Inline Style Removal

**User Story:** As a developer, I want form labels in `TaskDetailPanel.jsx` to use a CSS class instead of inline styles so that label typography is consistent and themeable.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.task-panel__label` that applies `font-size: var(--font-size-sm)`, `color: var(--color-fg-muted)`, `margin-top: 8px`, and `display: block` to form label elements inside the task panel.
2. THE TaskDetailPanel.jsx "Status" `<label>` element SHALL carry the `.task-panel__label` class and SHALL NOT contain any Inline Style.
3. THE TaskDetailPanel.jsx "Assignee" `<label>` element SHALL carry the `.task-panel__label` class and SHALL NOT contain any Inline Style.
4. IF additional `<label>` elements with equivalent inline typography styles exist in `TaskDetailPanel.jsx`, THEN those elements SHALL also carry the `.task-panel__label` class and SHALL NOT contain any Inline Style.

---

### Requirement 6 — ProjectHeader.jsx Inline Style Removal

**User Story:** As a developer, I want the title row and saving indicator in `ProjectHeader.jsx` to use CSS classes instead of inline styles so that the project header is fully class-driven.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.project-header-shell__title-row` that applies `display: flex`, `align-items: center`, and `gap: 12px` to the title-and-delete-button row container.
2. THE Design System SHALL define a CSS class `.project-header-shell__saving` that applies `font-size: var(--font-size-sm)`, `color: var(--color-fg-muted)`, and `margin-left: 8px` to the saving indicator `<span>`.
3. THE Design System SHALL define a CSS class `.project-header-shell__delete-btn` that applies `height: 34px` to the Delete button, or the `.btn` class SHALL be extended so that the height is not needed as an Inline Style.
4. THE ProjectHeader.jsx title-and-delete-button row `<div>` SHALL carry the `.project-header-shell__title-row` class and SHALL NOT contain any Inline Style.
5. THE ProjectHeader.jsx saving indicator `<span>` SHALL carry the `.project-header-shell__saving` class and SHALL NOT contain any Inline Style.
6. THE ProjectHeader.jsx Delete button SHALL NOT contain an Inline Style for `height`; the height SHALL be expressed via a CSS class.

---

### Requirement 7 — Landing.jsx Dark Mode Text Token Fix

**User Story:** As a user, I want the Landing page to display readable text in both light and dark mode so that the page is accessible regardless of the active theme.

#### Acceptance Criteria

1. THE `index.css` rule for `.landing-column__header h2` SHALL use `color: var(--color-fg-default)` instead of the hardcoded value `#24292f`.
2. THE `index.css` rule for `.landing-card h3` SHALL use `color: var(--color-fg-default)` instead of the hardcoded value `#24292f`.
3. THE `index.css` rule for `.landing-stat strong` and `.landing-feature h3` (currently combined in one rule) SHALL use `color: var(--color-fg-default)` instead of the hardcoded value `#24292f`.
4. THE `index.css` rule for `.landing-stat span` and `.landing-feature p` (currently combined in one rule) SHALL use `color: var(--color-fg-muted)` instead of the hardcoded value `#24292f`.
5. THE Landing.jsx JSX SHALL NOT require any changes; all fixes SHALL be applied exclusively in `index.css`.
6. WHEN the `body.dark` class is active, THE Landing page text elements covered by criteria 1–4 SHALL render using the dark-mode values of `--color-fg-default` (`#e6edf3`) and `--color-fg-muted` (`#7d8590`) as defined in `github-tokens.css`.

---

### Requirement 8 — AppShell Hamburger Menu for Mobile

**User Story:** As a user on a mobile device, I want a hamburger button in the top navigation bar that toggles the sidebar so that I can access navigation without the sidebar permanently occupying screen space.

#### Acceptance Criteria

1. THE TopNav.jsx component SHALL accept an `onToggleSidebar` prop (a callback function) and a `sidebarOpen` prop (a boolean).
2. WHEN the viewport width is 800 px or narrower, THE TopNav.jsx SHALL render a Hamburger Button in the `top-nav__left` section, immediately before the brand link.
3. THE Hamburger Button SHALL carry the CSS class `.hamburger-btn` and SHALL render a three-line icon (using the `Menu` icon from `lucide-react` at 18 px) when the sidebar is closed, and an `X` icon (18 px) when the sidebar is open.
4. WHEN a user clicks the Hamburger Button, THE TopNav.jsx SHALL invoke the `onToggleSidebar` callback.
5. THE Design System SHALL define `.hamburger-btn` with `display: none` by default and `display: inline-flex` inside a `@media (max-width: 800px)` rule, so the button is hidden on desktop viewports.
6. THE AppShell.jsx component SHALL manage a `sidebarOpen` boolean state, defaulting to `false` on mobile.
7. THE AppShell.jsx component SHALL pass `onToggleSidebar` and `sidebarOpen` as props to the `topNav` element via a `cloneElement` call or by accepting them as explicit props and threading them through.
8. THE ProjectSidebar.jsx component SHALL accept an `isOpen` prop (boolean) and, on viewports ≤800 px, SHALL apply the CSS class `.project-sidebar--open` when `isOpen` is `true` and omit it when `false`.
9. THE Design System SHALL define `.project-sidebar` on mobile (inside `@media (max-width: 800px)`) with `position: fixed`, `top: 56px`, `left: 0`, `height: calc(100vh - 56px)`, `z-index: 30`, `transform: translateX(-100%)`, and `transition: transform 0.2s ease` so the sidebar slides off-screen by default.
10. THE Design System SHALL define `.project-sidebar.project-sidebar--open` on mobile with `transform: translateX(0)` so the sidebar slides into view when open.
11. WHEN the sidebar is open on mobile and a user clicks a navigation link, THE sidebar SHALL close (i.e., `sidebarOpen` SHALL be set to `false`).
12. THE Hamburger Button SHALL have `aria-label="Toggle navigation"`, `aria-expanded` set to the value of `sidebarOpen`, and `aria-controls` referencing the sidebar element's `id`.

---

### Requirement 9 — BoardCard.jsx Label Container Inline Style Removal

**User Story:** As a developer, I want the labels container in `BoardCard.jsx` to use a CSS class instead of an inline style so that label layout is consistent and themeable.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.board-card__labels` that applies `display: flex`, `flex-wrap: wrap`, `gap: 6px`, and `margin-top: 8px` to the labels container element.
2. THE BoardCard.jsx labels container `<div>` SHALL carry the `.board-card__labels` class and SHALL NOT contain any Inline Style.
3. THE individual label `<span>` elements inside the labels container SHALL NOT contain any Inline Style for layout properties; the `textTransform: none` override SHALL be expressed via a CSS class `.board-card__label-badge` or via a modifier on the existing `.roadmap-task__status-badge` class.

---

### Requirement 10 — Global `.btn` Hover Fix for Light Mode

**User Story:** As a user in light mode, I want button hover states to use a light background color so that buttons do not appear with a dark background that is inconsistent with the light theme.

#### Acceptance Criteria

1. THE `github-tokens.css` `:root` block SHALL define `--color-btn-hover-bg: #f3f4f6` for the light mode button hover background.
2. THE `github-tokens.css` `.dark` block SHALL define `--color-btn-hover-bg: #30363d` for the dark mode button hover background.
3. THE `index.css` rule `.btn:hover:not(:disabled)` SHALL use `background: var(--color-btn-hover-bg)` instead of the hardcoded value `#30363d`.
4. WHEN the `body.dark` class is active and a user hovers over a `.btn` element, THE UI SHALL render the button background as `#30363d`.
5. WHEN the `body.dark` class is not active and a user hovers over a `.btn` element, THE UI SHALL render the button background as `#f3f4f6`.

---

### Requirement 11 — Global Heading Font-Weight Consistency

**User Story:** As a user, I want headings to have consistent font-weight and font-size across the application so that the typographic hierarchy is clear and predictable.

#### Acceptance Criteria

1. THE `index.css` global reset SHALL define `h1 { font-size: var(--font-size-2xl); font-weight: 600; }`.
2. THE `index.css` global reset SHALL define `h2 { font-size: var(--font-size-xl); font-weight: 600; }`.
3. THE `index.css` global reset SHALL define `h3 { font-size: var(--font-size-lg); font-weight: 600; }`.
4. THE heading rules in criteria 1–3 SHALL be placed in the global reset section of `index.css`, after the `*` box-sizing rule and before component-specific rules.
5. THE heading font-size rules SHALL NOT override component-specific heading sizes already defined by classes such as `.project-header-shell__title`, `.task-panel__title`, or `.landing-hero__copy h1`; those component rules SHALL take precedence via CSS specificity.

---

### Requirement 12 — Dashboard Lower-Section Inline Style Refactor

**User Story:** As a developer, I want the Task Distribution panel, Recent Tasks section, and Activity Logs section in `Dashboard.jsx` to use CSS classes and color tokens so that the lower half of the Dashboard is fully class-driven and dark-mode compatible.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.dashboard-distribution-panel` that applies `display: flex`, `align-items: flex-start`, `gap: 32px`, and `flex-wrap: wrap` to the Task Distribution panel inner container, replacing the Inline Style on that element.
2. THE Design System SHALL define a CSS class `.dashboard-distribution-left` that applies `flex: 1` and `min-width: 220px` to the left description and stats column, replacing the Inline Style on that element.
3. THE Design System SHALL define a CSS class `.dashboard-distribution-right` that applies `flex: 1`, `min-width: 280px`, and `height: 280px` to the right pie chart column, replacing the Inline Style on that element.
4. THE Design System SHALL define a CSS class `.dashboard-status-row` that applies `display: flex`, `align-items: center`, `gap: 12px`, `padding: 10px 14px`, and `border-radius: var(--border-radius-sm)` to each status breakdown row, replacing the Inline Style on those elements.
5. THE Design System SHALL define modifier classes `.dashboard-status-row--todo`, `.dashboard-status-row--in-progress`, and `.dashboard-status-row--done` that set the row `background` using Color Tokens (`rgba(110,118,129,0.12)`, `rgba(210,153,34,0.12)`, and `rgba(63,185,80,0.12)` respectively).
6. THE Design System SHALL define a CSS class `.dashboard-status-dot` that applies `width: 10px`, `height: 10px`, `border-radius: 50%`, and `flex-shrink: 0` to the status dot element; the `background` color SHALL be applied via an Inline Style only for the dynamic color value.
7. THE Design System SHALL define a CSS class `.dashboard-status-value` that applies `font-weight: bold` and `font-size: var(--font-size-xl)` to the numeric count element; the `color` SHALL be applied via an Inline Style only for the dynamic color value.
8. THE Design System SHALL define a CSS class `.dashboard-status-pct` that applies `font-size: var(--font-size-sm)`, `color: var(--color-fg-muted)`, `min-width: 36px`, and `text-align: right` to the percentage label, replacing the Inline Style on those elements.
9. THE Design System SHALL define a CSS class `.dashboard-distribution-desc` that applies `color: var(--color-fg-muted)`, `font-size: var(--font-size-md)`, `margin-bottom: 24px`, and `line-height: 1.6` to the description paragraph, replacing the Inline Style on that element.
10. THE Dashboard.jsx Task Distribution panel SHALL NOT contain any Inline Style that references a hardcoded color value (e.g. `#9CA3AF`, `#F59E0B`, `#22C55E`); all colors SHALL be expressed via Color Tokens or CSS custom properties.
11. THE Design System SHALL define a CSS class `.dashboard-bottom-row` that applies `display: flex` and `gap: 24px` to the bottom two-column row container, replacing the Inline Style on that element.
12. THE Design System SHALL define a CSS class `.dashboard-recent-tasks` that applies `flex: 1` to the Recent Tasks column container, replacing the Inline Style on that element.
13. THE Design System SHALL define a CSS class `.dashboard-task-list` that applies `margin-top: 16px`, `display: flex`, `flex-direction: column`, and `gap: 12px` to the task list container, replacing the Inline Style on that element.
14. THE Design System SHALL define a CSS class `.dashboard-task-item` that applies `padding: 16px`, `border-left: 4px solid var(--color-accent-emphasis)`, `background: var(--color-canvas-subtle)`, `border: 1px solid var(--color-border-default)`, and `border-radius: var(--border-radius-sm)` to each project task row, replacing the Inline Style on those elements.
15. THE Dashboard.jsx Recent Tasks section SHALL NOT contain any Inline Style that references the hardcoded value `#FFFFFF`; the task item background SHALL use `var(--color-canvas-subtle)`.
16. THE Design System SHALL define a CSS class `.dashboard-activity-col` that applies `flex: 1`, `display: flex`, `flex-direction: column`, and `gap: 24px` to the Activity Logs column container, replacing the Inline Style on that element.
17. THE Design System SHALL define a CSS class `.dashboard-activity-scroll` that applies `margin-top: 16px`, `max-height: 300px`, and `overflow-y: auto` to the scrollable activity list container, replacing the Inline Style on that element.
18. THE Design System SHALL define a CSS class `.dashboard-activity-item` that applies `padding: 12px 0` and `border-bottom: 1px solid var(--color-border-muted)` to each activity entry row, replacing the Inline Style on those elements.
19. THE Design System SHALL define a CSS class `.dashboard-activity-item__action` that applies `font-weight: normal` and `color: var(--color-fg-muted)` to the action text `<span>` within each activity entry, replacing the Inline Style on those elements.
20. THE Design System SHALL define a CSS class `.dashboard-activity-item__detail` that applies `font-size: var(--font-size-sm)`, `color: var(--color-fg-muted)`, and `margin-top: 4px` to the detail line, replacing the Inline Style on those elements.
21. THE Design System SHALL define a CSS class `.dashboard-activity-item__time` that applies `font-size: var(--font-size-xs)`, `color: var(--color-fg-muted)`, and `margin-top: 4px` to the timestamp line, replacing the Inline Style on those elements.
22. THE Dashboard.jsx `<h2>` heading element SHALL carry the `.dashboard-page-title` class (defined in the v2 spec) and SHALL NOT contain an Inline Style for `marginBottom`.
23. THE Dashboard.jsx Activity Logs section SHALL NOT contain any Inline Style on the activity list container, activity entry rows, or their child text elements.
