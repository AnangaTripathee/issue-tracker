import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { createIssueSchema } from "../../validationSchemas";

export async function POST(request: NextRequest) {
    // request.json() throws if the body is not valid JSON.
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const validation = createIssueSchema.safeParse(body);
    if (!validation.success)
        return NextResponse.json(validation.error.format(), { status: 400 });

    try {
        // Save the validated (trimmed) values, never the raw request body.
        const newIssue = await prisma.issue.create({
            data: { title: validation.data.title, description: validation.data.description }
        });
        return NextResponse.json(newIssue, { status: 201 });
    } catch (error) {
        // Keep the details in the server log; the client only gets a generic message.
        console.error("Failed to create issue:", error);
        return NextResponse.json({ error: "Could not create the issue. Please try again later." }, { status: 500 });
    }
}
