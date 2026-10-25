import { Prisma } from '@prisma/client';
import prisma from '@/prisma/client';
import type { CreateIssueInput, IssueQuery, UpdateIssueInput } from '@/app/validationSchemas';
import { MAX_DB_INT } from './ids';

// The fields every endpoint returns. The assignee is a small { id, name }
// object (or null) rather than the whole user record.
const issueSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    createdAt: true,
    updatedAt: true,
    assignee: { select: { id: true, name: true } }
} satisfies Prisma.IssueSelect;

// Prisma throws this error code when update/delete finds no matching row.
function isRecordNotFound(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// Prisma sends `contains` to MySQL as LIKE '%text%' without escaping the text,
// so a % or _ typed by the user would act as a wildcard ("50%" would match
// "50 items"). Putting a backslash (LIKE's escape character) before %, _ and
// \ itself makes them match literally.
function escapeLike(text: string) {
    return text.replace(/[\\%_]/g, char => `\\${char}`);
}

// Newest first. id breaks ties between issues created in the same millisecond.
// Optional filters (already validated by issueQuerySchema):
//   q      -> title OR description contains q
//   status -> status equals the value
// Both together mean (title OR description matches) AND status matches.
// Prisma ignores conditions whose value is undefined, so no filter = all issues.
// `contains` becomes SQL LIKE; with the columns' utf8mb4_unicode_ci collation
// it is case- and accent-insensitive.
export function listIssues(query: IssueQuery = {}) {
    const search = query.q ? escapeLike(query.q) : undefined;
    return prisma.issue.findMany({
        where: {
            status: query.status,
            OR: search
                ? [{ title: { contains: search } }, { description: { contains: search } }]
                : undefined
        },
        select: issueSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    });
}

// Returns null when the issue does not exist.
export function getIssue(id: number) {
    if (id > MAX_DB_INT) return null;
    return prisma.issue.findUnique({ where: { id }, select: issueSelect });
}

export function createIssue(data: CreateIssueInput) {
    return prisma.issue.create({ data, select: issueSelect });
}

// Only the fields present in `data` are changed. Prisma updates updatedAt
// automatically and never touches createdAt. Returns null when the issue does not exist.
export async function updateIssue(id: number, data: UpdateIssueInput) {
    if (id > MAX_DB_INT) return null;
    try {
        return await prisma.issue.update({ where: { id }, data, select: issueSelect });
    } catch (error) {
        if (isRecordNotFound(error)) return null;
        throw error;
    }
}

// Returns false when the issue does not exist.
export async function deleteIssue(id: number) {
    if (id > MAX_DB_INT) return false;
    try {
        await prisma.issue.delete({ where: { id } });
        return true;
    } catch (error) {
        if (isRecordNotFound(error)) return false;
        throw error;
    }
}
