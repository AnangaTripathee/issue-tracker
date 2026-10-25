'use client';

import { Button, Callout, Spinner, TextField } from '@radix-ui/themes'
import dynamic from 'next/dynamic';
import type { Editor } from 'codemirror';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import "easymde/dist/easymde.min.css";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { issueFormSchema } from '@/app/validationSchemas';
import { z } from 'zod';
import ErrorMessage from '@/app/component/ErrorMessage';

// The Markdown editor uses `document`, which does not exist while Next.js
// pre-renders the page on the server. Loading it only in the browser fixes
// the "document is not defined" build error.
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

// EasyMDE hides the real <textarea> and shows its own editor instead, so we
// also connect the label to the editor's input for keyboard and screen reader users.
const labelEditor = (editor: Editor) => {
  editor.getInputField().setAttribute('aria-labelledby', 'description-label');
};

type IssueForm = z.infer<typeof issueFormSchema>;

const NewIssuePage = () => {
  const router = useRouter();
  const {register, control, handleSubmit, formState:{errors}} = useForm<IssueForm>({
    resolver: zodResolver(issueFormSchema)
  });
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {  // moving inline function outside of the markup
      try {
        setSubmitting(true);
        setError(''); // clear the message from a previous failed attempt
        await axios.post('/api/issues', data);
        router.push('/issues');
      } catch {
        // The form keeps the entered values, so the user can simply retry.
        setSubmitting(false);
        setError('An unexpected error occurred. Please try again.');
      }
    })

  return (
    <div className="max-w-xl">
    {error && (
    <Callout.Root color='red' className='mb-5'>
      <Callout.Text>{error}</Callout.Text>
      </Callout.Root>
      )}

    <form
    className=  "space-y-3"
    onSubmit={onSubmit}>
        <div className="space-y-1">
          <label htmlFor="title" className="block font-medium">Title</label>
          <TextField.Root id="title" placeholder='Title' {...register('title')}/>
          <ErrorMessage>
          {errors.title?.message}
          </ErrorMessage>
        </div>

        <div className="space-y-1">
          <label id="description-label" htmlFor="description" className="block font-medium">Description</label>
          <Controller
          name="description"
          control={control}
          render={({ field}) => (
            <SimpleMDE id="description" placeholder='Description' getCodemirrorInstance={labelEditor} {...field} />
          )}
          />
          <ErrorMessage>
            {errors.description?.message}
          </ErrorMessage>
        </div>
        <Button disabled={isSubmitting}>{isSubmitting && <Spinner/>}Submit Issue </Button>

    </form>
    </div>
  )
}

export default NewIssuePage
