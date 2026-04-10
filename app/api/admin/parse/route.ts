import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { emptyProfile, ProfileInput } from "../../../../lib/schema";
import { parseProfileFromPost } from "../../../../lib/groq";

export async function POST(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const postText = (body?.postText || "").toString();
  const manualName = (body?.name || "").toString();
  const facebookProfileUrl = (body?.facebookProfileUrl || "").toString();

  if (!postText) {
    return NextResponse.json({ error: "Post text required" }, { status: 400 });
  }

  try {
    const parsed = await parseProfileFromPost(postText);
    const merged: ProfileInput = {
      ...emptyProfile(),
      ...parsed,
      name: manualName || parsed.name || "",
      facebookProfileUrl,
      rawPost: postText
    };

    return NextResponse.json({ profile: merged });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
