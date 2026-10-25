import { NextRequest, NextResponse } from "next/server";
import { createIssueSchema } from "../../validationSchemas";
import { jsonError, fieldError, readJson, serverError, validationError } from "@/lib/api";
import { createIssue, listIssues } from "@/lib/issues";
import { userExists } from "@/lib/users";

// GET /api/issues
export async function GET() {
    try {
        return NextResponse.json(await listIssues());
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
