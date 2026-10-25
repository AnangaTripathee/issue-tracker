import type { Priority, Status } from '@prisma/client';

// Human-readable names for the enum values stored in the database.
// Record<Status, ...> makes TypeScript complain if a value is missing.
export const statusLabels: Record<Status, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const priorityLabels: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

// Same date format on every page, e.g. "Oct 25, 2026".
export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
