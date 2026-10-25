import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Callout, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { issueQuerySchema } from '@/app/validationSchemas';
import { listIssues } from '@/lib/issues';
import IssueFilters from './IssueFilters';
import IssueTable from './IssueTable';

// This page lives in the "(list)" route group (the folder name in parentheses
// is not part of the URL, so it is still /issues). That keeps loading.tsx next
// to it from wrapping the detail and edit pages: a loading screen starts
// streaming the response with status 200, which would stop their not-found
// pages from returning 404.

// Read issues from the database on every request, not once at build time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Issues' };

// In Next.js 15+, searchParams is a Promise and must be awaited.
type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

const IssuesPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  // The same validation the API uses for GET /api/issues?q=...&status=...
  const query = issueQuerySchema.safeParse(params);

  const header = (
    <Flex justify="between" align="center" gap="3" wrap="wrap">
      <Heading as="h1" size="6">Issues</Heading>
      <Button asChild>
        <Link href="/issues/new">New Issue</Link>
      </Button>
    </Flex>
  );

  // Invalid parameters typed into the URL (e.g. ?status=DONE): explain instead of
  // showing a misleading list.
  if (!query.success) {
    const messages = Object.values(query.error.flatten().fieldErrors).flat();
    return (
      <Flex direction="column" gap="4">
        {header}
        <IssueFilters q={typeof params.q === 'string' ? params.q : ''} status="" showClear />
        <Callout.Root color="red" role="alert">
          <Callout.Text>
            These filters are not valid: {messages.join(' ')} Fix them above or clear the filters.
          </Callout.Text>
        </Callout.Root>
      </Flex>
    );
  }

  const { q = '', status = '' } = query.data;
  const isFiltered = q !== '' || status !== '';
  // A Server Component can call the data helper directly; no HTTP call to our own API.
  const issues = await listIssues(query.data);

  return (
    <Flex direction="column" gap="4">
      {header}
      {/* The key makes React recreate the inputs when the URL changes (for example
          with the browser's back/forward buttons), so they always show the URL's values. */}
      <IssueFilters key={JSON.stringify([q, status])} q={q} status={status} showClear={isFiltered} />

      {issues.length > 0 ? (
        <IssueTable issues={issues} />
      ) : isFiltered ? (
        <Card>
          <Flex direction="column" gap="2" align="start" p="2">
            <Text weight="medium">No issues match your search or filters.</Text>
            <Text color="gray">Try different words or another status.</Text>
            <Button asChild variant="soft">
              <Link href="/issues">Clear filters</Link>
            </Button>
          </Flex>
        </Card>
      ) : (
        <Card>
          <Flex direction="column" gap="2" align="start" p="2">
            <Text weight="medium">No issues yet</Text>
            <Text color="gray">Create the first issue to start tracking work.</Text>
            <Button asChild variant="soft">
              <Link href="/issues/new">Create an issue</Link>
            </Button>
          </Flex>
        </Card>
      )}
    </Flex>
  );
};

export default IssuesPage;
