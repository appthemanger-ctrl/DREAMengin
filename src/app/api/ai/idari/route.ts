import { NextRequest, NextResponse } from "next/server";
import { callAi } from "@/lib/ai/client";

/** IDARi is admin-only. Guard with DEV_ADMIN env var in development. */
export async function POST(req: NextRequest) {
  const isAdmin =
    process.env.DEV_ADMIN === "true" ||
    req.headers.get("x-admin-token") === process.env.ADMIN_TOKEN;

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { messages } = await req.json();
    const result = await callAi("idari", messages);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
