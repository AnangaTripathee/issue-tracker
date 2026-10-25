import { z } from 'zod';

// Description is stored in a MySQL TEXT column (65,535 bytes). With utf8mb4
// a character can take up to 4 bytes, so 10,000 characters always fits.
export const DESCRIPTION_MAX_LENGTH = 10_000;

export const createIssueSchema = z.object({
    // trim() runs before min(), so a title of only spaces is rejected.
    title: z
        .string({ required_error: 'Title is required.', invalid_type_error: 'Title must be text.' })
        .trim()
        .min(1, 'Title is required.')
        .max(255, 'Title must be 255 characters or fewer.'),
    description: z
        .string({ required_error: 'Description is required.', invalid_type_error: 'Description must be text.' })
        .trim()
        .min(1, 'Description is required.')
        .max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH.toLocaleString('en-US')} characters or fewer.`)
});
