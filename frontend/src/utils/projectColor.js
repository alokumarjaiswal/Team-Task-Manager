/**
 * Derives a deterministic color for a project from its _id string.
 * Algorithm: sum of charCodes(id) % palette.length
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
