import { Flex, Spinner, Text } from '@radix-ui/themes';

// Shown by Next.js while the issues list (/issues) is loading its data.
const IssuesLoading = () => {
  return (
    <Flex align="center" gap="2" role="status">
      <Spinner />
      <Text color="gray">Loading…</Text>
    </Flex>
  );
};

export default IssuesLoading;
