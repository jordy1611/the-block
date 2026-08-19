/**
 * Condition grade to colour token.
 *
 * Three buckets, not a gradient — it is a glance cue for scanning a grid, not a
 * second scale to learn.
 *
 * Its own file rather than an export from `ConditionGrade.tsx` for two reasons:
 * a component file that also exports a function breaks Fast Refresh, and the
 * card's overlay chip needs this mapping without needing the component. Two
 * places deciding what "good condition" looks like is one place too many.
 */
export function gradeColor(grade: number): string {
  if (grade >= 4) return 'var(--app-grade-high)';
  if (grade >= 3) return 'var(--app-grade-medium)';
  return 'var(--app-grade-low)';
}

