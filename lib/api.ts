import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Every error response has the same shape: { error: string, details?: ... }

export function jsonError(message: string, status: number, details?: unknown) {
    return NextResponse.json(details === undefined ? { error: message } : { error: message, details }, { status });
}

// 400 with per-field messages, e.g. { fieldErrors: { title: ['Title is required.'] }, formErrors: [] }
export function validationError(error: ZodError) {
    return jsonError('Validation failed.', 400, error.flatten());
}

// Same shape as validationError, for checks that need the database (e.g. "does this user exist?").
export function fieldError(field: string, message: string) {
    return jsonError('Validation failed.', 400, { formErrors: [], fieldErrors: { [field]: [message] } });
}

// Logs the real error on the server only; the client gets a generic message.
export function serverError(action: string, error: unknown) {
    console.error(`Failed to ${action}:`, error);
    return jsonError(`Could not ${action}. Please try again later.`, 500);
}

// Turns URL query parameters into the same shape Next.js gives pages as
// `searchParams`: one value -> string, a repeated parameter -> string[].
// That lets the API and the /issues page validate queries with one schema.
export function searchParamsToObject(params: URLSearchParams) {
    const result: Record<string, string | string[]> = {};
    for (const key of new Set(params.keys())) {
        const values = params.getAll(key);
        result[key] = values.length === 1 ? values[0] : values;
    }
    return result;
}

// request.json() throws on malformed JSON. Returns null in that case, otherwise
// { body } (wrapped, because a valid JSON body can itself be null).
export async function readJson(request: NextRequest): Promise<{ body: unknown } | null> {
    try {
        return { body: await request.json() };
    } catch {
        return null;
    }
}
