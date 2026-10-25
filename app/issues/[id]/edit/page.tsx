import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Heading } from '@radix-ui/themes';
import { parseId } from '@/lib/ids';
import { getIssue } from '@/lib/issues';
import { listUsers } from '@/lib/users';
import IssueForm from '../../_components/IssueForm';
import UsersLoadError from '../../_components/UsersLoadError';

export const metadata: Metadata = { title: 'Edit Issue' };

// In Next.js 15+, route params are a Promise and must be awaited.
type Props = { params: Promise<{ id: string }> };

const EditIssuePage = async ({ params }: Props) => {
  const id = parseId((await params).id);
  if (id === null) notFound();

  const issue = await getIssue(id);
  if (!issue) notFound();

  const users = await listUsers().catch(error => {
    console.error('Failed to load users:', error);
    return null;
  });

  return (
    <>
      <Heading as="h1" size="6" mb="4">Edit Issue</Heading>
      {users ? (
        <IssueForm
          users={users}
          // Only plain values (no Date objects) are passed to the Client Component.
          issue={{
            id: issue.id,
            title: issue.title,
            description: issue.description,
            status: issue.status,
            priority: issue.priority,
            assigneeId: issue.assignee?.id ?? null,
          }}
        />
      ) : (
        <UsersLoadError />
      )}
    </>
  );
};

export default EditIssuePage;
