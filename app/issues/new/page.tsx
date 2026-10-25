import type { Metadata } from 'next';
import { Heading } from '@radix-ui/themes';
import { listUsers } from '@/lib/users';
import IssueForm from '../_components/IssueForm';
import UsersLoadError from '../_components/UsersLoadError';

// Read users on every request, not once at build time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'New Issue' };

const NewIssuePage = async () => {
  const users = await listUsers().catch(error => {
    console.error('Failed to load users:', error);
    return null;
  });

  return (
    <>
      <Heading as="h1" size="6" mb="4">New Issue</Heading>
      {users ? <IssueForm users={users} /> : <UsersLoadError />}
    </>
  );
};

export default NewIssuePage;
