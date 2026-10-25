import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { listIssues } from '@/lib/issues';
import { PriorityBadge, StatusBadge } from '../_components/IssueBadges';
import { formatDate } from '../_components/issueLabels';

// This page lives in the "(list)" route group (the folder name in parentheses
// is not part of the URL, so it is still /issues). That keeps loading.tsx next
// to it from wrapping the detail and edit pages: a loading screen starts
// streaming the response with status 200, which would stop their not-found
// pages from returning 404.

// Read issues from the database on every request, not once at build time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Issues' };

const IssuesPage = async () => {
  // A Server Component can call the data helper directly; no HTTP call to our own API.
  const issues = await listIssues();

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center" gap="3" wrap="wrap">
        <Heading as="h1" size="6">Issues</Heading>
        <Button asChild>
          <Link href="/issues/new">New Issue</Link>
        </Button>
      </Flex>

      {issues.length === 0 ? (
        <Card>
          <Flex direction="column" gap="2" align="start" p="2">
            <Text weight="medium">No issues yet</Text>
            <Text color="gray">Create the first issue to start tracking work.</Text>
            <Button asChild variant="soft">
              <Link href="/issues/new">Create an issue</Link>
            </Button>
          </Flex>
        </Card>
      ) : (
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
      )}
    </Flex>
  );
};

export default IssuesPage;
