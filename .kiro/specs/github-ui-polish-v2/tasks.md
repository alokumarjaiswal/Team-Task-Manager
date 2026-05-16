# Implementation Plan: github-ui-polish-v2

## Overview

CSS + JSX only polish pass targeting five files: `index.css`, `Projects.jsx`, `ProjectWorkspace.jsx`, `Dashboard.jsx`, and `Login.jsx`. All changes replace inline styles with CSS classes backed by design tokens. No new dependencies, no backend changes.

---

## Tasks

- [ ] 1. Add all new CSS classes to `index.css`
  - [ ] 1.1 Add modal classes and workspace error banner
    - Append a `/* ── Modals ── */` section with `.modal-overlay`, `.modal-dialog`, `.modal-dialog--wide`, and `.workspace-error-banner` rules using design tokens
    - `.modal-overlay`: `position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000` — no `backdrop-filter`
    - `.modal-dialog`: `background: var(--color-canvas-subtle); border: 1px solid var(--color-border-default); border-radius: var(--border-radius-md); box-shadow: 0 8px 24px rgba(0,0,0,0.2); width: 100%; max-width: 400px; padding: var(--space-6)`
    - `.modal-dialog--wide`: `max-width: 560px`
    - `.workspace-error-banner`: `margin: 0 0 12px; padding: 12px 14px; border-radius: var(--border-radius-md); border: 1px solid var(--color-border-default); background: var(--color-canvas-subtle); color: var(--color-fg-muted)`
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.5_

  - [ ] 1.2 Update `.project-card` and add hover/transition rules
    - Update the existing `.project-card` rule: add `background: var(--color-canvas-subtle)`, `border: 1px solid var(--color-border-default)`, `border-radius: var(--border-radius-md)`, `transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease`, `position: relative`
    - Add `.project-card:hover` rule: `transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); border-color: var(--color-border-default)`
    - Add `transition: color 0.15s ease` to `.project-card__open`
    - _Requirements: 1.1, 1.4, 1.5, 8.1, 8.7_

  - [ ] 1.3 Add micro-interaction transitions to existing selectors
    - Add `transition: background-color 0.15s ease` to `.btn` and a `.btn:active { transform: scale(0.97) }` rule
    - Add `transition: background-color 0.15s ease, color 0.15s ease` to `.project-sidebar__link, .project-sidebar__project`
    - Add `transition: background-color 0.15s ease` to `.table-view__row`
    - Verify `.roadmap-task` already has `transition: background-color 0.2s ease, border-color 0.2s ease`; add if missing
    - Add `transition: opacity 0.15s ease` to `.icon-button, .theme-toggle, .avatar-button`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.8_

  - [ ] 1.4 Add Dashboard CSS classes
    - Add `.dashboard-page-title { margin-bottom: 24px }`
    - Ensure `.dashboard-section-title` has `display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-3)`
    - Add `.dashboard-distribution-panel`, `.dashboard-distribution-left`, `.dashboard-distribution-right`, `.dashboard-distribution-desc`
    - Add `.dashboard-status-row` base class and modifier classes `.dashboard-status-row--todo`, `.dashboard-status-row--in-progress`, `.dashboard-status-row--done` with token-based `background` and dot/value colors
    - Add `.dashboard-status-dot`, `.dashboard-status-label`, `.dashboard-status-value`, `.dashboard-status-pct`
    - Add `.dashboard-bottom-row`, `.dashboard-recent-tasks`, `.dashboard-task-list`, `.dashboard-task-item`, `.dashboard-task-item__header`, `.dashboard-empty`
    - Add `.dashboard-activity-col`, `.dashboard-activity-scroll`, `.dashboard-activity-item`, `.dashboard-activity-item__action`, `.dashboard-activity-item__detail`, `.dashboard-activity-item__time`
    - _Requirements: 4.1–4.7, 5.1–5.6, 6.1–6.7, 7.1, 7.3_

  - [ ] 1.5 Add Login CSS classes
    - Add `.auth-brand-row { display: flex; justify-content: center; margin-bottom: 16px }`
    - Add `.auth-logo { text-align: center; margin-bottom: 8px }`
    - Add `margin-top: 8px` to `.btn--full`
    - Add `.auth-toggle-row { text-align: center; margin-top: 24px; font-size: var(--font-size-md); color: var(--color-fg-muted) }`
    - Ensure `.auth-subtitle` has `color: var(--color-fg-muted)`
    - _Requirements: 9.1–9.6_

- [ ] 2. Refactor `Projects.jsx`
  - [ ] 2.1 Replace project card markup — remove `.glass-panel`, add accent strip
    - Import `projectIdToColor` from `../utils/projectColor`
    - On each card `div`: remove `glass-panel` from `className`, add `style={{ borderLeft: \`3px solid ${projectIdToColor(project._id)}\` }}` as the only inline style
    - Remove any other inline styles on the card container element
    - _Requirements: 1.1, 1.2, 1.3, 1.6_

  - [ ] 2.2 Replace Create Project modal inline styles with CSS classes
    - Change overlay `div` from inline-style to `className="modal-overlay"`
    - Change dialog `div` from `className="glass-panel"` + inline `style` to `className="modal-dialog"`
    - _Requirements: 2.3, 2.4_

  - [ ] 2.3 Replace Edit Project modal inline styles with CSS classes
    - Change overlay `div` from inline-style to `className="modal-overlay"`
    - Change dialog `div` from `className="glass-panel"` + inline `style` to `className="modal-dialog"`
    - _Requirements: 2.5, 2.6_

  - [ ]* 2.4 Write unit tests for Projects.jsx modal and card markup
    - Render `Projects` with mock project data; assert `.project-card` is present and `.glass-panel` is absent on card containers
    - Assert `borderLeft` inline style is set on each card container
    - Assert Create/Edit modal overlays carry `.modal-overlay` with no `style` prop; dialogs carry `.modal-dialog` with no `style` prop
    - _Requirements: 1.1, 1.3, 2.3, 2.4, 2.5, 2.6_

- [ ] 3. Checkpoint — Projects.jsx
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Refactor `ProjectWorkspace.jsx`
  - [ ] 4.1 Replace New Task modal inline styles with CSS classes
    - Change overlay `div` from inline-style to `className="modal-overlay"`
    - Change dialog `div` from `className="glass-panel"` + inline `style` to `className="modal-dialog modal-dialog--wide"`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.2 Replace workspaceLoadError banner inline style with CSS class
    - Change the error banner `div` from inline-style to `className="workspace-error-banner"`
    - _Requirements: 3.5_

  - [ ]* 4.3 Write unit tests for ProjectWorkspace.jsx modal and error banner markup
    - Render `ProjectWorkspace` with `showNewTaskModal` forced to `true`; assert `.modal-overlay`, `.modal-dialog`, `.modal-dialog--wide` are present with no `style` prop on those elements
    - Render with a `workspaceLoadError` value; assert `.workspace-error-banner` is present with no `style` prop
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 5. Refactor `Dashboard.jsx`
  - [ ] 5.1 Replace page title and section title inline styles
    - Change `<h2 style={{marginBottom: '24px'}}>` to `<h2 className="dashboard-page-title">`
    - Verify chart panel `<h3>` elements already carry `.dashboard-section-title`; remove any remaining inline styles from them
    - _Requirements: 7.2, 7.4_

  - [ ] 5.2 Refactor Task Distribution panel
    - Replace the outer `style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}` div with `className="dashboard-distribution-panel"`
    - Replace the left column inline style div with `className="dashboard-distribution-left"`
    - Replace the right column inline style div with `className="dashboard-distribution-right"`
    - Replace the description `<p>` inline style with `className="dashboard-distribution-desc"`
    - Replace the `<h3>` inline style with `className="dashboard-section-title"`
    - _Requirements: 4.1, 4.2, 4.3, 7.5_

  - [ ] 5.3 Replace status row inline styles with modifier classes
    - Change the `.map()` data array to use `{ label, modifier, value }` shape (modifiers: `todo`, `in-progress`, `done`)
    - Replace each row `div` inline style with `className={\`dashboard-status-row dashboard-status-row--${item.modifier}\`}`
    - Replace the dot `div` inline style with `className="dashboard-status-dot"`
    - Replace the label `<span>` inline style with `className="dashboard-status-label"`
    - Replace the value `<span>` inline style with `className="dashboard-status-value"`
    - Replace the percentage `<span>` inline style with `className="dashboard-status-pct"`
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ] 5.4 Refactor Recent Tasks section
    - Replace the bottom row container `style={{ display: 'flex', gap: '24px' }}` with `className="dashboard-bottom-row"`
    - Replace the left column `className="glass-panel"` + `style={{ flex: 1 }}` with `className="glass-panel dashboard-recent-tasks"`
    - Replace the task list container inline style with `className="dashboard-task-list"`
    - Replace each project row `className="glass-panel"` + inline style with `className="dashboard-task-item"`
    - Replace the empty-state `<p>` inline style with `className="dashboard-empty"`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 5.5 Refactor Activity Logs section
    - Replace the right column inline style div with `className="dashboard-activity-col"`
    - Replace the scroll container inline style div with `className="dashboard-activity-scroll"`
    - Replace each activity entry `div` inline style with `className="dashboard-activity-item"`
    - Replace the action `<span>` inline style with `className="dashboard-activity-item__action"`
    - Replace the detail `<div>` inline style with `className="dashboard-activity-item__detail"`
    - Replace the timestamp `<div>` inline style with `className="dashboard-activity-item__time"`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 5.6 Write unit tests for Dashboard.jsx class-driven markup
    - Render `Dashboard` with mock data; assert `.dashboard-page-title`, `.dashboard-distribution-panel`, `.dashboard-status-row--todo`, `.dashboard-status-row--in-progress`, `.dashboard-status-row--done`, `.dashboard-task-item`, `.dashboard-activity-item` are present
    - Assert no hardcoded hex color values (`#9CA3AF`, `#F59E0B`, `#22C55E`, `#FFFFFF`) appear in any `style` prop on those elements
    - _Requirements: 4.5, 5.5, 7.2_

- [ ] 6. Checkpoint — Dashboard.jsx
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Refactor `Login.jsx`
  - [ ] 7.1 Replace Login.jsx inline styles with CSS classes
    - Change the GitHubMark wrapper `div` from inline style to `className="auth-brand-row"`
    - Change `<h2 className="logo" style={{ textAlign: 'center', marginBottom: '8px' }}>` to `<h2 className="logo auth-logo">`
    - Remove `style={{ marginTop: '8px' }}` from the submit `<button>` (margin now lives in `.btn--full`)
    - Change the toggle link container `div` from inline style to `className="auth-toggle-row"`
    - Remove the inner `<span style={{ color: 'var(--color-fg-muted)' }}>` inline style (color now inherited from `.auth-toggle-row`)
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ]* 7.2 Write unit tests for Login.jsx class-driven markup
    - Render `Login`; assert `.auth-brand-row` and `.auth-toggle-row` are present with no `style` prop on those elements
    - Assert the submit button has no `style` prop
    - _Requirements: 9.1, 9.2, 9.4_

- [ ] 8. Write property-based tests for `projectIdToColor`
  - [ ]* 8.1 Write property test: palette membership and determinism
    - Create `frontend/src/__tests__/projectColor.property.test.js`
    - Use `fast-check` (or available PBT library) to assert that for any non-empty string `id`, `projectIdToColor(id)` returns a value contained in `PROJECT_COLOR_PALETTE` and returns the same value on a second call
    - **Property 1: projectIdToColor always returns a palette member**
    - **Property 2: projectIdToColor is deterministic**
    - **Validates: Requirements 1.2**

  - [ ]* 8.2 Write property test: edge-case safety
    - In the same test file, assert that for any string `id` (including empty string, single char, very long, digits-only, Unicode), `projectIdToColor(id)` does not throw and returns a string
    - **Property 3: projectIdToColor handles edge-case ids without throwing**
    - **Validates: Requirements 1.2**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The only permitted inline style on project cards is `style={{ borderLeft: \`3px solid ${projectIdToColor(project._id)}\` }}` — it is dynamic and cannot be expressed as a static CSS class
- All other visual and layout styles must reference CSS custom properties from `github-tokens.css`
- No `backdrop-filter` or `blur` on any modal overlay
- Property tests (8.1, 8.2) target the pure `projectIdToColor` utility — they are cheap to run and catch palette/determinism regressions
- CSS hover/transition rules (`:hover`, `:active`, `transition`) cannot be verified by unit tests; validate manually after implementation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "4.1", "4.2", "5.1", "7.1"] },
    { "id": 2, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 3, "tasks": ["2.4", "4.3", "5.6", "7.2", "8.1", "8.2"] }
  ]
}
```
