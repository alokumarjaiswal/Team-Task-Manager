# Requirements Document

## Introduction

This feature delivers a second GitHub-quality UI/UX polish pass on the Team Task Manager frontend, building on the first pass (`github-ui-polish`). The scope targets four areas that were not fully addressed in the first pass: (1) flat GitHub-style project cards in `Projects.jsx`, (2) proper modal CSS classes replacing inline-style overlays in both `Projects.jsx` and `ProjectWorkspace.jsx`, (3) a full inline-style removal and dark-mode fix pass on the lower sections of `Dashboard.jsx` (Task Distribution panel, Recent Tasks, Activity Logs), and (4) hover states and micro-interaction transitions across all interactive elements. Minor remaining inline styles in `Login.jsx` are also cleaned up. No backend changes are in scope.

---

## Glossary

- **Design System**: The set of CSS custom properties defined in `github-tokens.css` and utility classes in `index.css`.
- **Color Token**: A CSS custom property defined in `github-tokens.css` (e.g. `--color-canvas-subtle`, `--color-border-default`).
- **Flat Card**: A card element with a solid background, a 1 px border, and no `backdrop-filter` or glass/blur effects.
- **Left Accent Strip**: A 3–4 px left border on a card element that uses a project-derived or semantic color token to provide visual hierarchy.
- **Project Color**: A color value stored on or deterministically derived from a project record, used to tint the Left Accent Strip on a Project Card.
- **Modal Overlay**: A full-viewport fixed-position backdrop element that dims the page behind a dialog.
- **Modal Dialog**: The centered content container rendered on top of the Modal Overlay.
- **Task Distribution Panel**: The `glass-panel` section in `Dashboard.jsx` that contains the status breakdown list and the donut `PieChart`.
- **Recent Tasks Section**: The left column in the bottom row of `Dashboard.jsx` that lists projects with task counts.
- **Activity Logs Section**: The right column in the bottom row of `Dashboard.jsx` that lists recent activity entries.
- **Micro-interaction**: A brief CSS transition or transform applied to an interactive element in response to a user action (hover, active press).
- **Inline Style**: A `style={{ … }}` prop applied directly to a JSX element rather than via a CSS class.
- **Projects.jsx**: The React component at `frontend/src/pages/Projects.jsx`.
- **ProjectWorkspace.jsx**: The React component at `frontend/src/pages/ProjectWorkspace.jsx`.
- **Dashboard.jsx**: The React component at `frontend/src/pages/Dashboard.jsx`.
- **Login.jsx**: The React component at `frontend/src/components/Login.jsx`.

---

## Requirements

### Requirement 1 — Flat GitHub-Style Project Cards

**User Story:** As a user, I want project cards to use a flat, bordered GitHub-style design with a colored left accent strip so that the Projects page feels visually consistent with the rest of the application and project identity is immediately visible.

#### Acceptance Criteria

1. THE UI SHALL render each Project Card with `background: var(--color-canvas-subtle)`, `border: 1px solid var(--color-border-default)`, and `border-radius: var(--border-radius-md)` via the `.project-card` CSS class.
2. THE UI SHALL render a Left Accent Strip on each Project Card as a `border-left` of `3px solid <project-color>`, where `<project-color>` is derived deterministically from the project's `_id` using a fixed palette of at least six distinct color tokens defined in `github-tokens.css`.
3. THE UI SHALL NOT apply `backdrop-filter`, `blur`, or the `.glass-panel` class to Project Cards.
4. WHEN a user hovers over a Project Card, THE UI SHALL apply `transform: translateY(-2px)` and `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12)` to that card via a `.project-card:hover` CSS rule.
5. THE UI SHALL apply the hover transition via `transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease` on the `.project-card` CSS class.
6. THE Projects.jsx component SHALL NOT contain any Inline Style on Project Card container elements; all card layout and visual styles SHALL be expressed via CSS classes.
7. THE UI SHALL retain the existing `.project-card__actions`, `.project-card__title-row`, `.project-card__description`, `.project-card__summary`, `.project-card__chart`, and `.project-card__meta` sub-element classes for internal card structure.

---

### Requirement 2 — Modal CSS Classes in Projects.jsx

**User Story:** As a developer, I want the Create Project and Edit Project modals in `Projects.jsx` to use dedicated CSS classes instead of inline styles so that modal appearance is consistent, themeable, and dark-mode compatible.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.modal-overlay` that applies `position: fixed`, `inset: 0`, `background: rgba(0, 0, 0, 0.6)`, `display: flex`, `justify-content: center`, `align-items: center`, and `z-index: 1000` — with no `backdrop-filter` or blur.
2. THE Design System SHALL define a CSS class `.modal-dialog` that applies `background: var(--color-canvas-subtle)`, `border: 1px solid var(--color-border-default)`, `border-radius: var(--border-radius-md)`, `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2)`, `width: 100%`, `max-width: 400px`, and `padding: var(--space-6)`.
3. THE Projects.jsx Create Project modal overlay element SHALL carry the `.modal-overlay` class and SHALL NOT contain any Inline Style on that element.
4. THE Projects.jsx Create Project modal dialog element SHALL carry the `.modal-dialog` class and SHALL NOT contain any Inline Style on that element.
5. THE Projects.jsx Edit Project modal overlay element SHALL carry the `.modal-overlay` class and SHALL NOT contain any Inline Style on that element.
6. THE Projects.jsx Edit Project modal dialog element SHALL carry the `.modal-dialog` class and SHALL NOT contain any Inline Style on that element.

---

### Requirement 3 — Modal CSS Classes in ProjectWorkspace.jsx

**User Story:** As a developer, I want the New Task modal in `ProjectWorkspace.jsx` to use the same `.modal-overlay` and `.modal-dialog` CSS classes so that all modals in the application share a consistent, blur-free appearance.

#### Acceptance Criteria

1. THE ProjectWorkspace.jsx New Task modal overlay element SHALL carry the `.modal-overlay` class and SHALL NOT contain any Inline Style on that element.
2. THE ProjectWorkspace.jsx New Task modal dialog element SHALL carry the `.modal-dialog` class and SHALL NOT contain any Inline Style on that element.
3. WHEN the `.modal-dialog` class is applied to the New Task modal, THE UI SHALL render the dialog with `max-width: 560px`, overriding the default `400px` via a modifier class `.modal-dialog--wide` or an inline `max-width` override on the element — the overlay itself SHALL remain class-only.
4. THE ProjectWorkspace.jsx New Task modal SHALL NOT apply `backdrop-filter` or `blur` to the overlay element.
5. THE workspaceLoadError inline-style `<div>` in ProjectWorkspace.jsx SHALL be replaced with a CSS class `.workspace-error-banner` that applies `margin`, `padding`, `border-radius`, `border`, `background`, and `color` via the Design System tokens.

---

### Requirement 4 — Dashboard Task Distribution Panel Refactor

**User Story:** As a user, I want the Task Distribution panel on the Dashboard to use CSS classes and color tokens so that it renders correctly in both light and dark mode without hardcoded color values.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.dashboard-distribution-panel` that applies `display: flex`, `align-items: flex-start`, `gap: 32px`, and `flex-wrap: wrap` to the Task Distribution panel container, replacing the Inline Style on that element.
2. THE Design System SHALL define a CSS class `.dashboard-distribution-left` that applies `flex: 1` and `min-width: 220px` to the left description and stats column, replacing the Inline Style on that element.
3. THE Design System SHALL define a CSS class `.dashboard-distribution-right` that applies `flex: 1`, `min-width: 280px`, and `height: 280px` to the right pie chart column, replacing the Inline Style on that element.
4. THE Design System SHALL define a CSS class `.dashboard-status-row` that applies `display: flex`, `align-items: center`, `gap: 12px`, `padding: 10px 14px`, and `border-radius: var(--border-radius-sm)` to each status breakdown row, replacing the Inline Style on those elements.
5. THE Dashboard.jsx Task Distribution panel SHALL NOT contain any Inline Style that references a hardcoded color value (e.g. `#9CA3AF`, `#F59E0B`, `#22C55E`); all colors SHALL be expressed via Color Tokens or CSS custom properties scoped to the `.dashboard-status-row` modifier classes.
6. THE Design System SHALL define modifier classes `.dashboard-status-row--todo`, `.dashboard-status-row--in-progress`, and `.dashboard-status-row--done` that set the row `background` and the status dot `background` using Color Tokens (`--color-fg-subtle`, `--color-attention-fg`, `--color-success-fg` respectively).
7. THE Dashboard.jsx Task Distribution panel description paragraph SHALL apply `color: var(--color-fg-muted)` via a CSS class rather than an Inline Style.

---

### Requirement 5 — Dashboard Recent Tasks Section Refactor

**User Story:** As a developer, I want the Recent Tasks section in `Dashboard.jsx` to use CSS classes and color tokens so that the section is maintainable and dark-mode compatible.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.dashboard-bottom-row` that applies `display: flex` and `gap: 24px` to the bottom two-column row container, replacing the Inline Style on that element.
2. THE Design System SHALL define a CSS class `.dashboard-recent-tasks` that applies `flex: 1` to the Recent Tasks column container, replacing the Inline Style on that element.
3. THE Design System SHALL define a CSS class `.dashboard-task-list` that applies `margin-top: 16px`, `display: flex`, `flex-direction: column`, and `gap: 12px` to the task list container, replacing the Inline Style on that element.
4. THE Design System SHALL define a CSS class `.dashboard-task-item` that applies `padding: 16px`, `border-left: 4px solid var(--color-accent-emphasis)`, `background: var(--color-canvas-subtle)`, `border: 1px solid var(--color-border-default)`, and `border-radius: var(--border-radius-sm)` to each project task row, replacing the Inline Style on those elements.
5. THE Dashboard.jsx Recent Tasks section SHALL NOT contain any Inline Style that references the hardcoded value `#FFFFFF`; the task item background SHALL use `var(--color-canvas-subtle)`.
6. THE Dashboard.jsx Recent Tasks empty-state paragraph SHALL apply `color: var(--color-fg-muted)` via a CSS class rather than an Inline Style.

---

### Requirement 6 — Dashboard Activity Logs Section Refactor

**User Story:** As a developer, I want the Activity Logs section in `Dashboard.jsx` to use CSS classes and color tokens so that the section is maintainable and dark-mode compatible.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.dashboard-activity-col` that applies `flex: 1`, `display: flex`, `flex-direction: column`, and `gap: 24px` to the Activity Logs column container, replacing the Inline Style on that element.
2. THE Design System SHALL define a CSS class `.dashboard-activity-scroll` that applies `margin-top: 16px`, `max-height: 300px`, and `overflow-y: auto` to the scrollable activity list container, replacing the Inline Style on that element.
3. THE Design System SHALL define a CSS class `.dashboard-activity-item` that applies `padding: 12px 0` and `border-bottom: 1px solid var(--color-border-muted)` to each activity entry row, replacing the Inline Style on those elements.
4. THE Design System SHALL define a CSS class `.dashboard-activity-item__action` that applies `font-weight: normal` and `color: var(--color-fg-muted)` to the action text `<span>` within each activity entry, replacing the Inline Style on those elements.
5. THE Design System SHALL define a CSS class `.dashboard-activity-item__detail` that applies `font-size: var(--font-size-sm)`, `color: var(--color-fg-muted)`, and `margin-top: 4px` to the detail line, replacing the Inline Style on those elements.
6. THE Design System SHALL define a CSS class `.dashboard-activity-item__time` that applies `font-size: var(--font-size-xs)`, `color: var(--color-fg-muted)`, and `margin-top: 4px` to the timestamp line, replacing the Inline Style on those elements.
7. THE Dashboard.jsx Activity Logs section SHALL NOT contain any Inline Style on the activity list container, activity entry rows, or their child text elements.

---

### Requirement 7 — Dashboard Section Title and Header Cleanup

**User Story:** As a developer, I want the Dashboard heading and section title styles to use CSS classes so that typography is consistent and no Inline Styles remain on heading elements.

#### Acceptance Criteria

1. THE Design System SHALL define a CSS class `.dashboard-page-title` that applies `margin-bottom: 24px` to the top-level `<h2>` heading, replacing the Inline Style on that element.
2. THE Dashboard.jsx top-level `<h2>` element SHALL carry the `.dashboard-page-title` class and SHALL NOT contain an Inline Style for `marginBottom`.
3. THE Design System SHALL ensure the existing `.dashboard-section-title` class applies `display: flex`, `align-items: center`, `gap: 8px`, and `margin-bottom: var(--space-3)` so that chart panel `<h3>` elements use it without Inline Styles.
4. THE Dashboard.jsx chart panel `<h3>` elements SHALL carry the `.dashboard-section-title` class and SHALL NOT contain any Inline Style.
5. THE Dashboard.jsx Task Distribution panel `<h3>` element SHALL carry the `.dashboard-section-title` class and SHALL NOT contain any Inline Style.

---

### Requirement 8 — Hover States and Micro-Interactions

**User Story:** As a user, I want all interactive elements to have visible hover states and smooth transitions so that the interface feels responsive and polished.

#### Acceptance Criteria

1. THE Design System SHALL define a `transition` property of `transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease` on the `.project-card` class so that card hover lift is animated.
2. WHEN a user hovers over a `.btn` or `.btn--primary` element, THE UI SHALL apply a `background-color` change within `0.15s ease` via a `transition: background-color 0.15s ease` rule on the `.btn` class.
3. WHEN a user presses (`:active` state) a `.btn` or `.btn--primary` element, THE UI SHALL apply `transform: scale(0.97)` to provide tactile press feedback.
4. THE Design System SHALL define `transition: background-color 0.15s ease, color 0.15s ease` on `.project-sidebar__link` and `.project-sidebar__project` elements so that sidebar hover color changes are animated.
5. WHEN a user hovers over a `.table-view__row`, THE UI SHALL apply a `background-color` transition within `0.15s ease`.
6. WHEN a user hovers over a `.roadmap-task`, THE UI SHALL apply `background-color` and `border-color` transitions within `0.2s ease`, as already partially defined; THE Design System SHALL ensure these transitions are present on the `.roadmap-task` class.
7. THE Design System SHALL define `transition: color 0.15s ease` on `.project-card__open` so that the "Open" link color change on card hover is animated.
8. THE Design System SHALL define `transition: opacity 0.15s ease` on `.icon-button`, `.theme-toggle`, and `.avatar-button` elements so that TopNav button hover opacity changes are animated.

---

### Requirement 9 — Login.jsx Remaining Inline Style Cleanup

**User Story:** As a developer, I want the remaining inline styles in `Login.jsx` to be replaced with CSS classes so that the auth page is fully class-driven and consistent with the rest of the codebase.

#### Acceptance Criteria

1. THE Login.jsx submit button SHALL NOT contain an Inline Style for `marginTop`; the `.btn--full` CSS class SHALL include `margin-top: 8px` or the margin SHALL be applied via a wrapper class.
2. THE Login.jsx toggle link container `<div>` SHALL NOT contain an Inline Style for `textAlign`, `marginTop`, or `fontSize`; these SHALL be applied via a CSS class named `.auth-toggle-row`.
3. THE Design System SHALL define `.auth-toggle-row` with `text-align: center`, `margin-top: 24px`, and `font-size: var(--font-size-md)`.
4. THE Login.jsx GitHubMark icon button container `<div>` SHALL NOT contain an Inline Style for `display`, `justifyContent`, or `marginBottom`; these SHALL be applied via a CSS class named `.auth-brand-row`.
5. THE Design System SHALL define `.auth-brand-row` with `display: flex`, `justify-content: center`, and `margin-bottom: 16px`.
6. IF the `.auth-subtitle` CSS class does not already define `color: var(--color-fg-muted)`, THEN THE Design System SHALL add that declaration so that the subtitle paragraph requires no Inline Style.
