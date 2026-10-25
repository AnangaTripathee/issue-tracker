import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Box, Button, Card, DataList, Flex, Heading, Text } from '@radix-ui/themes';
import Markdown from 'react-markdown';
import { parseId } from '@/lib/ids';
import { getIssue } from '@/lib/issues';
import { PriorityBadge, StatusBadge } from '../_components/IssueBadges';
import { formatDate } from '../_components/issueLabels';
import DeleteIssueButton from './DeleteIssueButton';

export const metadata: Metadata = { title: 'Issue Details' };

// In Next.js 15+, route params are a Promise and must be awaited.
type Props = { params: Promise<{ id: string }> };

const IssueDetailPage = async ({ params }: Props) => {
  // "abc", "-1" and IDs that do not exist all show the not-found page.
  const id = parseId((await params).id);
  if (id === null) notFound();

  const issue = await getIssue(id);
  if (!issue) notFound();

  return (
    <Flex direction={{ initial: 'column', md: 'row' }} gap="5">
      <Box className="min-w-0 flex-1 space-y-4">
        <Heading as="h1" size="6" className="break-words">{issue.title}</Heading>

        <DataList.Root orientation={{ initial: 'vertical', sm: 'horizontal' }}>
          <DataList.Item>
            <DataList.Label>Status</DataList.Label>
            <DataList.Value><StatusBadge status={issue.status} /></DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Priority</DataList.Label>
            <DataList.Value><PriorityBadge priority={issue.priority} /></DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Assignee</DataList.Label>
            <DataList.Value>
              {issue.assignee ? issue.assignee.name : <Text color="gray">Unassigned</Text>}
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Created</DataList.Label>
            <DataList.Value>
              <time dateTime={issue.createdAt.toISOString()}>{formatDate(issue.createdAt)}</time>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label>Updated</DataList.Label>
            <DataList.Value>
              <time dateTime={issue.updatedAt.toISOString()}>{formatDate(issue.updatedAt)}</time>
            </DataList.Value>
          </DataList.Item>
        </DataList.Root>

        {/* react-markdown never renders raw HTML from the description (it is shown as
            plain text) and removes unsafe links such as javascript: URLs. */}
        <Card className="markdown">
          <Markdown>{issue.description}</Markdown>
        </Card>
      </Box>

      <Flex direction={{ initial: 'row', md: 'column' }} gap="3" className="md:w-48" wrap="wrap">
        <Button asChild>
          <Link href={`/issues/${issue.id}/edit`}>Edit Issue</Link>
        </Button>
        <DeleteIssueButton issueId={issue.id} />
      </Flex>
    </Flex>
  );
};

export default IssueDetailPage;
