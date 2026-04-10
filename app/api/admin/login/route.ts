import { NextResponse } from "next/server";
import { setSessionCookie } from "../../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = (body?.email || "").toString().trim();
  const password = (body?.password || "").toString();

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Missing admin env" }, { status: 500 });
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  setSessionCookie(email);
  return NextResponse.json({ ok: true });
}
