import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { emptyProfile } from "../../../../lib/schema";

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data = { ...emptyProfile(), ...body };

  if (!data.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const created = await prisma.profile.create({ data });
  return NextResponse.json({ profile: created });
}

export async function PUT(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = (body?.id || "").toString();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: { ...body }
  });

  return NextResponse.json({ profile: updated });
}

export async function DELETE(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = (body?.id || "").toString();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
