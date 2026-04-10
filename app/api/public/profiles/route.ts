import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  const publicProfiles = profiles.map((profile) => {
    const { facebookProfileUrl, rawPost, ...rest } = profile;
    return rest;
  });

  return NextResponse.json({ profiles: publicProfiles });
}
