import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { listUsers } from "@/lib/users";

// GET /api/users
export async function GET() {
    try {
        return NextResponse.json(await listUsers());
    } catch (error) {
        return serverError("load users", error);
    }
}
