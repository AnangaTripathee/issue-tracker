import { Badge } from '@radix-ui/themes';
import type { Priority, Status } from '@prisma/client';
import { priorityLabels, statusLabels } from './issueLabels';

type BadgeColor = React.ComponentProps<typeof Badge>['color'];

const statusColors: Record<Status, BadgeColor> = {
  OPEN: 'red',
  IN_PROGRESS: 'violet',
  RESOLVED: 'green',
  CLOSED: 'gray',
};

const priorityColors: Record<Priority, BadgeColor> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge color={statusColors[status]}>{statusLabels[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge color={priorityColors[priority]} variant="outline">{priorityLabels[priority]}</Badge>;
}
