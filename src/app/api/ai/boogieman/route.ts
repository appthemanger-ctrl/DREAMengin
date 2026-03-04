import { NextRequest, NextResponse } from "next/server";
import { callAi } from "@/lib/ai/client";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const result = await callAi("boogieman", messages);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
