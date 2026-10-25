import Link from 'next/link';
import { Flex, Table, Text } from '@radix-ui/themes';
import type { listIssues } from '@/lib/issues';
import { PriorityBadge, StatusBadge } from '../_components/IssueBadges';
import { formatDate } from '../_components/issueLabels';

type Props = { issues: Awaited<ReturnType<typeof listIssues>> };

const IssueTable = ({ issues }: Props) => {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
          {/* On narrow screens these columns are hidden and shown under the title instead. */}
          <Table.ColumnHeaderCell className="hidden md:table-cell">Status</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden md:table-cell">Priority</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden md:table-cell">Assignee</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell className="hidden md:table-cell">Created</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {issues.map(issue => (
          <Table.Row key={issue.id}>
            <Table.Cell>
              <Link href={`/issues/${issue.id}`} className="font-medium text-violet-700 hover:underline break-words">
                {issue.title}
              </Link>
              <Flex gap="2" mt="1" wrap="wrap" align="center" className="md:hidden">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
                <Text size="1" color="gray">{issue.assignee?.name ?? 'Unassigned'}</Text>
              </Flex>
            </Table.Cell>
            <Table.Cell className="hidden md:table-cell"><StatusBadge status={issue.status} /></Table.Cell>
            <Table.Cell className="hidden md:table-cell"><PriorityBadge priority={issue.priority} /></Table.Cell>
            <Table.Cell className="hidden md:table-cell">
              {issue.assignee ? issue.assignee.name : <Text color="gray">Unassigned</Text>}
            </Table.Cell>
            <Table.Cell className="hidden md:table-cell">
              <time dateTime={issue.createdAt.toISOString()}>{formatDate(issue.createdAt)}</time>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default IssueTable;
