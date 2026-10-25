import { NextRequest, NextResponse } from "next/server";
import { createIssueSchema, issueQuerySchema } from "../../validationSchemas";
import { jsonError, fieldError, readJson, searchParamsToObject, serverError, validationError } from "@/lib/api";
import { createIssue, listIssues } from "@/lib/issues";
import { userExists } from "@/lib/users";

// GET /api/issues?q=<search>&status=<STATUS>  (both optional, see docs/api.md)
export async function GET(request: NextRequest) {
    const query = issueQuerySchema.safeParse(searchParamsToObject(request.nextUrl.searchParams));
    if (!query.success) return validationError(query.error);

    try {
        return NextResponse.json(await listIssues(query.data));
    } catch (error) {
        return serverError("load issues", error);
    }
}

// POST /api/issues
export async function POST(request: NextRequest) {
    const json = await readJson(request);
    if (!json) return jsonError("Request body must be valid JSON.", 400);

    const validation = createIssueSchema.safeParse(json.body);
    if (!validation.success) return validationError(validation.error);
    const data = validation.data; // validated and trimmed values only

    try {
        if (typeof data.assigneeId === "number" && !(await userExists(data.assigneeId)))
            return fieldError("assigneeId", "Assignee does not exist.");

        return NextResponse.json(await createIssue(data), { status: 201 });
    } catch (error) {
        return serverError("create the issue", error);
    }
}
