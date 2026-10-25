import { z } from 'zod';
import type { Priority, Status } from '@prisma/client';

// Description is stored in a MySQL TEXT column (65,535 bytes). With utf8mb4
// a character can take up to 4 bytes, so 10,000 characters always fits.
export const DESCRIPTION_MAX_LENGTH = 10_000;

// These lists must match the enums in prisma/schema.prisma. `satisfies` makes
// TypeScript fail if a value here is not a real Prisma enum value. (Only the
// types are imported, so the browser bundle does not include Prisma.)
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const satisfies readonly Status[];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const satisfies readonly Priority[];

// trim() runs before min(), so a title of only spaces is rejected.
const title = z
    .string({ required_error: 'Title is required.', invalid_type_error: 'Title must be text.' })
    .trim()
    .min(1, 'Title is required.')
    .max(255, 'Title must be 255 characters or fewer.');

const description = z
    .string({ required_error: 'Description is required.', invalid_type_error: 'Description must be text.' })
    .trim()
    .min(1, 'Description is required.')
    .max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH.toLocaleString('en-US')} characters or fewer.`);

const status = z.enum(STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(', ')}.` })
});

const priority = z.enum(PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${PRIORITIES.join(', ')}.` })
});

// null means "unassigned". Whether the user exists is checked against the database later.
const assigneeId = z
    .number({ invalid_type_error: 'Assignee ID must be a number or null.' })
    .int('Assignee ID must be a whole number.')
    .positive('Assignee ID must be a positive number.')
    .nullable();

// Used by the New Issue form, which only edits the title and description.
export const issueFormSchema = z.object({ title, description });

// POST /api/issues. Omitted fields get their database defaults:
// status OPEN, priority MEDIUM, no assignee.
export const createIssueSchema = issueFormSchema.extend({
    status: status.optional(),
    priority: priority.optional(),
    assigneeId: assigneeId.optional()
});

// PATCH /api/issues/:id. Every field is optional and has no default, so
// fields left out of the request are not changed. Unknown fields are dropped,
// and a request with no supported fields left is rejected.
export const updateIssueSchema = createIssueSchema
    .partial()
    .refine(data => Object.keys(data).length > 0, {
        message: 'Provide at least one field to update: title, description, status, priority or assigneeId.'
    });

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
