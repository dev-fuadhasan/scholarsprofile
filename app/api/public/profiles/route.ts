import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  const publicProfiles = profiles.map((profile) => {
    const { facebookProfileUrl, rawPost, ...rest } = profile;
    return rest;
  });

  return NextResponse.json(
    { profiles: publicProfiles },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
