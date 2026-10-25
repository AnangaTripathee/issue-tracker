'use client';

import { Button, Callout, Flex } from '@radix-ui/themes';

// Shown by Next.js when a page under /issues fails unexpectedly (for example,
// the database is unreachable). The real error is logged on the server; the
// user only sees a generic message. retry() loads the page again.
const IssuesError = ({ retry }: { error: Error & { digest?: string }; retry: () => void }) => {
  return (
    <Flex direction="column" gap="3" align="start" className="max-w-xl">
      <Callout.Root color="red" role="alert">
        <Callout.Text>Something went wrong while loading this page. Please try again.</Callout.Text>
      </Callout.Root>
      <Button onClick={() => retry()}>Try again</Button>
    </Flex>
  );
};

export default IssuesError;
