import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";

export async function GET() {
  const ok = requireAdmin();
  return NextResponse.json({ ok });
}
