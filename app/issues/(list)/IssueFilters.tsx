import Form from 'next/form';
import Link from 'next/link';
import { Button, TextField } from '@radix-ui/themes';
import { SEARCH_MAX_LENGTH, STATUSES } from '@/app/validationSchemas';
import { statusLabels } from '../_components/issueLabels';

type Props = {
  q: string;       // current search from the URL ('' = none)
  status: string;  // current status from the URL ('' = all)
  showClear: boolean;
};

// A plain GET form: submitting it goes to /issues?q=...&status=... (the browser
// URL-encodes the values). next/form does this as an in-app navigation instead
// of a full page reload. Both fields are always submitted together, so changing
// one keeps the other.
const IssueFilters = ({ q, status, showClear }: Props) => {
  return (
    <Form action="/issues" role="search" aria-label="Filter issues" className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1">
        <label htmlFor="q" className="font-medium">Search</label>
        <TextField.Root
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Title or description"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="font-medium">Status</label>
        {/* A native <select> is submitted with the form as-is and works with the keyboard. */}
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="h-8 rounded border border-zinc-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map(value => (
            <option key={value} value={value}>{statusLabels[value]}</option>
          ))}
        </select>
      </div>

      <Button type="submit">Search</Button>
      {showClear && (
        <Button asChild variant="soft" color="gray">
          <Link href="/issues">Clear filters</Link>
        </Button>
      )}
    </Form>
  );
};

export default IssueFilters;
