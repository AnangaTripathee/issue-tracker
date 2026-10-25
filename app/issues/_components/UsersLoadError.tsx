'use client';

import { Button, Callout, Flex } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

// Shown instead of the issue form when the list of users could not be loaded,
// so the assignee choices are never silently empty.
const UsersLoadError = () => {
  const router = useRouter();
  return (
    <Flex direction="column" gap="3" align="start" className="max-w-xl">
      <Callout.Root color="red" role="alert">
        <Callout.Text>
          Could not load the list of users, so the form cannot be shown right now. Please try again.
        </Callout.Text>
      </Callout.Root>
      <Button onClick={() => router.refresh()}>Try again</Button>
    </Flex>
  );
};

export default UsersLoadError;
