# Requirements Document

## Introduction

This feature delivers a comprehensive UI/UX polish pass to align the Team Task Manager frontend with GitHub's design language. The scope covers six surfaces: Landing page, Login/Auth, Dashboard, Projects, TopNav dropdown, and ProjectSidebar. Key changes include redesigning Dashboard stat cards to GitHub-style summary boxes, adding icons and project color dots to the sidebar, switching the primary button color from green to blue, and eliminating scattered inline styles in favour of CSS class-based rules. The result should feel visually consistent, accessible, and immediately familiar to GitHub users.

## Glossary

- **UI**: The frontend user interface rendered in the browser.
- **Design System**: The set of CSS custom properties defined in `github-tokens.css` and `index.css`.
- **Primary Button**: Any element carrying the `.btn--primary` CSS class.
- **Stat Card**: One of the three summary boxes on the Dashboard that display Total Tasks, Completed, and In Progress counts.
- **Sidebar**: The `<aside>` element rendered by `ProjectSidebar.jsx` containing navigation links and project list.
- **TopNav**: The sticky `<header>` element rendered by `TopNav.jsx`.
- **Inline Style**: A `style={{ … }}` prop applied directly to a JSX element rather than via a CSS class.
- **Color Token**: A CSS custom property defined in `github-tokens.css` (e.g. `--color-accent-emphasis`, `--color-success-emphasis`).
- **Accent Strip**: A 4 px left border on a Stat Card that uses a color token to provide visual hierarchy.
- **Project Color Dot**: A small colored circle rendered next to each project name in the Sidebar to aid visual identification.

---

## Requirements

### Requirement 1 — Primary Button Color

**User Story:** As a user, I want primary action buttons to use blue so that the interface matches GitHub's visual convention and I can distinguish primary actions from success states.

#### Acceptance Criteria

1. THE Design System SHALL define `--color-btn-primary-bg` as `var(--color-accent-emphasis)` (resolving to `#0969da` in light mode and `#1f6feb` in dark mode).
2. THE Design System SHALL define `--color-btn-primary-hover-bg` as `var(--color-accent-fg)` (resolving to `#0366d6` in light mode and `#58a6ff` in dark mode).
3. WHEN a user hovers over a `.btn--primary` element, THE UI SHALL render the button background using `--color-btn-primary-hover-bg`.
4. THE Design System SHALL retain `--color-success-emphasis` (`#2ea043` / `#238636`) exclusively for success-state indicators and SHALL NOT apply it to `.btn--primary`.
5. THE UI SHALL apply `.btn--primary` text color as `var(--color-fg-on-emphasis)` (`#ffffff`) in both light and dark modes.

---

### Requirement 2 — Dashboard Stat Cards Redesign

**User Story:** As a user, I want the Dashboard stat cards to use a flat, bordered GitHub-style layout so that key metrics are easy to scan without visual noise from large icons or glass effects.

#### Acceptance Criteria

1. THE UI SHALL render each Stat Card as a flat box with `background: var(--color-canvas-subtle)`, `border: 1px solid var(--color-border-default)`, and `border-radius: var(--border-radius-sm)`.
2. THE UI SHALL render a 4 px left Accent Strip on each Stat Card using a distinct color token: `--color-accent-emphasis` for Total Tasks, `--color-success-emphasis` for Completed, and `--color-attention-fg` for In Progress.
3. THE UI SHALL display the metric number in each Stat Card at `font-size: var(--font-size-2xl)` with `font-weight: 600`.
4. THE UI SHALL display the metric label in each Stat Card at `font-size: var(--font-size-sm)` with `color: var(--color-fg-muted)`.
5. THE UI SHALL render a small icon (16 px) aligned to the right side of each Stat Card using the same color token as the Accent Strip.
6. THE UI SHALL NOT apply the `.glass-panel` class or large (32 px) icons to Stat Cards.
7. THE UI SHALL lay out the three Stat Cards in a three-column grid with `gap: var(--space-4)` on viewports wider than 640 px.
8. WHEN the viewport width is 640 px or narrower, THE UI SHALL collapse the Stat Card grid to a single column.

---

### Requirement 3 — Sidebar Navigation Icons

**User Story:** As a user, I want each navigation item in the sidebar to display a recognisable icon so that I can identify sections at a glance without reading the label.

#### Acceptance Criteria

1. THE Sidebar SHALL render the `LayoutDashboard` icon (16 px) from `lucide-react` immediately before the "Overview" navigation label.
2. THE Sidebar SHALL render the `FolderKanban` icon (16 px) from `lucide-react` immediately before the "Projects" navigation label.
3. THE Sidebar SHALL render the `CheckSquare` icon (16 px) from `lucide-react` immediately before the "Task Board" navigation label.
4. THE Sidebar SHALL render the `Users` icon (16 px) from `lucide-react` immediately before the "Team" navigation label.
5. THE Sidebar SHALL apply `color: var(--color-fg-muted)` to each navigation icon when the link is not active.
6. WHEN a navigation link is active, THE Sidebar SHALL apply `color: var(--color-accent-fg)` to the corresponding icon.
7. THE Sidebar SHALL NOT render the existing `.project-sidebar__dot` placeholder element for main navigation items.

---

### Requirement 4 — Sidebar Project Color Dots

**User Story:** As a user, I want each project in the sidebar to display a unique color dot so that I can visually identify projects without reading their full names.

#### Acceptance Criteria

1. THE Sidebar SHALL render a Project Color Dot (8 px circle) immediately before each project name in the "Your projects" list.
2. THE Sidebar SHALL derive each Project Color Dot color deterministically from the project's `_id` string using a fixed palette of at least six distinct color tokens.
3. THE Sidebar SHALL apply the derived color as the `background` of the Project Color Dot element.
4. WHEN a project link is active, THE Sidebar SHALL retain the Project Color Dot with its derived color unchanged.
5. THE Sidebar SHALL NOT use `var(--color-fg-subtle)` as the Project Color Dot color (the current default dot color).

---

### Requirement 5 — TopNav Dropdown Inline Style Removal

**User Story:** As a developer, I want the TopNav dropdown to use CSS classes instead of inline styles so that the codebase is easier to maintain and theme overrides work correctly.

#### Acceptance Criteria

1. THE TopNav SHALL apply dropdown container positioning, background, border, border-radius, box-shadow, min-width, and z-index via a CSS class named `.avatar-dropdown`.
2. THE TopNav SHALL apply the dropdown header (user name) padding, border-bottom, font-size, and font-weight via a CSS class named `.avatar-dropdown__header`.
3. THE TopNav SHALL apply the logout button display, width, padding, background, border, text-align, cursor, font-size, and color via a CSS class named `.avatar-dropdown__item`.
4. THE TopNav JSX SHALL NOT contain any `style={{ … }}` prop on the dropdown container, dropdown header, or logout button elements.
5. THE `.avatar-dropdown__item` CSS class SHALL set `color: var(--color-danger-fg)` for the logout action.

---

### Requirement 6 — Dashboard Inline Style Reduction

**User Story:** As a developer, I want Dashboard layout and typography styles moved to CSS classes so that the component is easier to read and global theme changes propagate correctly.

#### Acceptance Criteria

1. THE Dashboard SHALL define a CSS class `.dashboard-stat-grid` that applies the three-column grid layout for Stat Cards, replacing the inline `style` grid on the stat card container `<div>`.
2. THE Dashboard SHALL define a CSS class `.dashboard-stat-card` that encapsulates Stat Card box styles (background, border, border-radius, padding, display, gap), replacing per-card inline styles.
3. THE Dashboard SHALL define a CSS class `.dashboard-section-title` that applies heading margin and flex alignment for chart section titles, replacing inline `style` on `<h3>` elements.
4. THE Dashboard SHALL define a CSS class `.dashboard-charts-grid` that applies the auto-fit grid layout for the two chart panels, replacing the inline `style` grid on the charts container `<div>`.
5. WHEN the Dashboard JSX references layout or typography styles, THE Dashboard SHALL use the defined CSS classes rather than inline `style` props for those properties.

---

### Requirement 7 — Landing Page Typography and Spacing Refinement

**User Story:** As a visitor, I want the landing page to use consistent GitHub-aligned typography and spacing so that the page feels polished and trustworthy.

#### Acceptance Criteria

1. THE Landing page SHALL apply `font-family: var(--font-sans)` to all body text elements via the global `*` reset already present in `index.css`.
2. THE Landing page SHALL render the hero heading (`<h1>`) with `letter-spacing: -0.02em` and `line-height: 1.02` as already defined in `.landing-hero__copy h1`.
3. THE Landing page SHALL render `.landing-stat` elements with `padding: 12px 14px` and `border-radius: 10px` as already defined, and SHALL NOT override these values with inline styles.
4. THE Landing page SHALL render `.landing-feature` elements with `padding: 14px` and `border-radius: 10px` as already defined, and SHALL NOT override these values with inline styles.
5. WHEN the viewport width is 920 px or narrower, THE Landing page SHALL collapse the hero grid to a single column as defined in the existing `@media (max-width: 920px)` rule.
6. THE Landing page board preview SHALL render column status dots using the `column.color` value from the `boardPreview` data array, maintaining distinct colors for Todo (`#58a6ff`), In Progress (`#d29922`), and Done (`#3fb950`).

---

### Requirement 8 — Login / Auth Page Polish

**User Story:** As a user, I want the login and signup form to use the primary button style and consistent spacing so that the auth experience matches the rest of the application.

#### Acceptance Criteria

1. THE Login form submit button SHALL carry the `.btn--primary` class so that it renders in blue (`--color-btn-primary-bg`) consistent with Requirement 1.
2. THE Login form submit button SHALL apply `width: 100%` and `padding: 12px` via a CSS class named `.btn--full` rather than an inline `style` prop.
3. THE Login page SHALL apply the toggle link color via `color: var(--color-accent-fg)` using a CSS class named `.auth-toggle-link` rather than an inline `style` prop.
4. THE Login page SHALL apply the GitHubMark icon button dimensions (48 px width and height, 50% border-radius) via a CSS class named `.auth-brand-icon` rather than an inline `style` prop.
5. THE Login page SHALL apply the subtitle paragraph color via `color: var(--color-fg-muted)` using a CSS class rather than an inline `style` prop.

---

### Requirement 9 — Global Focus and Transition Consistency

**User Story:** As a user, I want interactive elements to have consistent focus rings and smooth transitions so that the interface feels responsive and accessible.

#### Acceptance Criteria

1. THE Design System SHALL define a focus ring via `box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3)` on `:focus-visible` for `input`, `select`, `textarea`, `button`, and `a` elements, as already present in `index.css`.
2. THE UI SHALL apply `transition: background-color 0.15s ease` to `.btn`, `.btn--primary`, `.project-sidebar__link`, and `.project-sidebar__project` elements.
3. THE UI SHALL apply `transition: background-color 0.2s ease, color 0.2s ease` to `body` for theme switching, as already present in `index.css`.
4. IF a `.btn` or `.btn--primary` element has the `disabled` attribute, THEN THE UI SHALL apply `opacity: 0.6` and `cursor: not-allowed` to that element.
5. THE UI SHALL NOT apply focus outlines via `outline: none` without providing an alternative visible focus indicator on the same element.
