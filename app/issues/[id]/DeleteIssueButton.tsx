'use client';

import { AlertDialog, Button, Callout, Flex, Spinner } from '@radix-ui/themes';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { readApiError } from '../_components/apiError';

const DeleteIssueButton = ({ issueId }: { issueId: number }) => {
  const router = useRouter();
  const [isDeleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Runs only after the user confirms in the dialog.
  const deleteIssue = async () => {
    try {
      setDeleting(true);
      setError('');
      // Success is 204 No Content: there is no body, so nothing is read from the response.
      await axios.delete(`/api/issues/${issueId}`);
      router.push('/issues');
      router.refresh(); // so the list no longer shows the deleted issue
    } catch (error) {
      setDeleting(false); // re-enable the button so the user can retry
      setError(readApiError(error).error ?? 'Could not delete the issue. Please try again.');
    }
  };

  return (
    <Flex direction="column" gap="3">
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button color="red" disabled={isDeleting}>
            {isDeleting && <Spinner />}
            Delete Issue
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Delete this issue?</AlertDialog.Title>
          <AlertDialog.Description>
            The issue will be permanently deleted. This cannot be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            {/* Cancel just closes the dialog; nothing is sent to the server. */}
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={deleteIssue}>Delete</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {error && (
        <Callout.Root color="red" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
    </Flex>
  );
};

export default DeleteIssueButton;
