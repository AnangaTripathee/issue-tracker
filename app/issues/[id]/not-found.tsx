import Link from 'next/link';
import { Button, Flex, Heading, Text } from '@radix-ui/themes';

// Shown when notFound() is called for an issue page: an invalid ID such as
// "abc", or an issue that does not exist (for example, one that was deleted).
const IssueNotFound = () => {
  return (
    <Flex direction="column" gap="3" align="start">
      <Heading as="h1" size="6">Issue not found</Heading>
      <Text>This issue does not exist. It may have been deleted, or the link may be wrong.</Text>
      <Button asChild>
        <Link href="/issues">Back to issues</Link>
      </Button>
    </Flex>
  );
};

export default IssueNotFound;
