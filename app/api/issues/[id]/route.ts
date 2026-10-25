import { NextRequest, NextResponse } from "next/server";
import { updateIssueSchema } from "@/app/validationSchemas";
import { jsonError, fieldError, readJson, serverError, validationError } from "@/lib/api";
import { parseId } from "@/lib/ids";
import { deleteIssue, getIssue, updateIssue } from "@/lib/issues";
import { userExists } from "@/lib/users";

// In Next.js 15+, route params are a Promise and must be awaited.
type Context = { params: Promise<{ id: string }> };

const invalidId = () => jsonError("Issue ID must be a positive whole number.", 400);
const notFound = () => jsonError("Issue not found.", 404);

// GET /api/issues/:id
export async function GET(_request: NextRequest, { params }: Context) {
    const id = parseId((await params).id);
    if (id === null) return invalidId();

    try {
        const issue = await getIssue(id);
        return issue ? NextResponse.json(issue) : notFound();
    } catch (error) {
        return serverError("load the issue", error);
    }
}

// PATCH /api/issues/:id
export async function PATCH(request: NextRequest, { params }: Context) {
    const id = parseId((await params).id);
    if (id === null) return invalidId();

    const json = await readJson(request);
    if (!json) return jsonError("Request body must be valid JSON.", 400);

    const validation = updateIssueSchema.safeParse(json.body);
    if (!validation.success) return validationError(validation.error);
    const data = validation.data; // only the fields the client sent

    try {
        if (typeof data.assigneeId === "number" && !(await userExists(data.assigneeId)))
            return fieldError("assigneeId", "Assignee does not exist.");

        const issue = await updateIssue(id, data);
        return issue ? NextResponse.json(issue) : notFound();
    } catch (error) {
        return serverError("update the issue", error);
    }
}

// DELETE /api/issues/:id
export async function DELETE(_request: NextRequest, { params }: Context) {
    const id = parseId((await params).id);
    if (id === null) return invalidId();

    try {
        const deleted = await deleteIssue(id);
        return deleted ? new NextResponse(null, { status: 204 }) : notFound();
    } catch (error) {
        return serverError("delete the issue", error);
    }
}
