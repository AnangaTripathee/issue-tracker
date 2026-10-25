'use client';

import { Button, Callout, Flex, Select, Spinner, TextField } from '@radix-ui/themes';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Editor } from 'codemirror';
import type { Priority, Status } from '@prisma/client';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import "easymde/dist/easymde.min.css";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createIssueSchema, PRIORITIES, STATUSES } from '@/app/validationSchemas';
import ErrorMessage from '@/app/component/ErrorMessage';
import { priorityLabels, statusLabels } from './issueLabels';
import { readApiError } from './apiError';

// The Markdown editor uses `document`, which does not exist while Next.js
// pre-renders the page on the server. Loading it only in the browser fixes
// the "document is not defined" build error.
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

// EasyMDE hides the real <textarea> and shows its own editor instead, so we
// also connect the label to the editor's input for keyboard and screen reader users.
const labelEditor = (editor: Editor) => {
  editor.getInputField().setAttribute('aria-labelledby', 'description-label');
};

// Radix Select items cannot have an empty value, so "no assignee" gets its own value.
const UNASSIGNED = 'unassigned';

type IssueFormData = z.infer<typeof createIssueSchema>;
const FIELDS = ['title', 'description', 'status', 'priority', 'assigneeId'] as const;

type Props = {
  users: { id: number; name: string }[];
  // Present when editing; missing when creating a new issue.
  issue?: { id: number; title: string; description: string; status: Status; priority: Priority; assigneeId: number | null };
};

const IssueForm = ({ users, issue }: Props) => {
  const router = useRouter();
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<IssueFormData>({
    // The same schema the API uses, so the browser shows the same messages.
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      title: issue?.title ?? '',
      description: issue?.description ?? '',
      status: issue?.status ?? 'OPEN',
      priority: issue?.priority ?? 'MEDIUM',
      assigneeId: issue?.assigneeId ?? null,
    },
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  // Shows the API's per-field messages next to the matching inputs.
  const showApiError = (error: unknown) => {
    const body = readApiError(error);
    let shownOnField = false;
    for (const field of FIELDS) {
      const message = body.details?.fieldErrors?.[field]?.[0];
      if (message) {
        setError(field, { message });
        shownOnField = true;
      }
    }
    setFormError(
      body.details?.formErrors?.[0] ??
      (shownOnField ? 'Please correct the highlighted fields.' : body.error ?? 'An unexpected error occurred. Please try again.')
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      setSubmitting(true);
      setFormError(''); // clear the message from a previous failed attempt
      const response = issue
        ? await axios.patch<{ id: number }>(`/api/issues/${issue.id}`, data)
        : await axios.post<{ id: number }>('/api/issues', data);
      router.push(`/issues/${response.data.id}`);
      router.refresh(); // so the list and detail pages show the new values
    } catch (error) {
      // The form keeps the entered values, so the user can fix them and retry.
      setSubmitting(false);
      showApiError(error);
    }
  });

  return (
    <div className="max-w-xl">
      {formError && (
        <Callout.Root color='red' className='mb-5' role='alert'>
          <Callout.Text>{formError}</Callout.Text>
        </Callout.Root>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label htmlFor="title" className="block font-medium">Title</label>
          <TextField.Root id="title" placeholder='Title' {...register('title')} />
          <ErrorMessage>{errors.title?.message}</ErrorMessage>
        </div>

        <div className="space-y-1">
          <label id="description-label" htmlFor="description" className="block font-medium">Description</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <SimpleMDE id="description" placeholder='Description' getCodemirrorInstance={labelEditor} {...field} />
            )}
          />
          <ErrorMessage>{errors.description?.message}</ErrorMessage>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="status" className="block font-medium">Status</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select.Root value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger id="status" className="w-full" />
                  <Select.Content>
                    {STATUSES.map(status => (
                      <Select.Item key={status} value={status}>{statusLabels[status]}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
            <ErrorMessage>{errors.status?.message}</ErrorMessage>
          </div>

          <div className="space-y-1">
            <label htmlFor="priority" className="block font-medium">Priority</label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select.Root value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger id="priority" className="w-full" />
                  <Select.Content>
                    {PRIORITIES.map(priority => (
                      <Select.Item key={priority} value={priority}>{priorityLabels[priority]}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
            <ErrorMessage>{errors.priority?.message}</ErrorMessage>
          </div>

          <div className="space-y-1">
            <label htmlFor="assignee" className="block font-medium">Assignee</label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select.Root
                  // The form stores a number or null; the Select works with strings.
                  value={field.value == null ? UNASSIGNED : String(field.value)}
                  onValueChange={value => field.onChange(value === UNASSIGNED ? null : Number(value))}
                >
                  <Select.Trigger id="assignee" className="w-full" />
                  <Select.Content>
                    <Select.Item value={UNASSIGNED}>Unassigned</Select.Item>
                    {users.map(user => (
                      <Select.Item key={user.id} value={String(user.id)}>{user.name}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            />
            <ErrorMessage>{errors.assigneeId?.message}</ErrorMessage>
          </div>
        </div>

        <Flex gap="3" align="center">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            {issue ? 'Save Changes' : 'Create Issue'}
          </Button>
          <Button asChild variant="soft" color="gray">
            <Link href={issue ? `/issues/${issue.id}` : '/issues'}>Cancel</Link>
          </Button>
        </Flex>
      </form>
    </div>
  );
};

export default IssueForm;
