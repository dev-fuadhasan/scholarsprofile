import { NextResponse } from "next/server";
import { generateReportSummary, ReportProfileInput } from "../../../../lib/groq";

const MAX_REPORT_PROFILES = 40;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profiles = (body?.profiles || []) as ReportProfileInput[];

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json({ error: "Profiles required" }, { status: 400 });
    }

    if (profiles.length > MAX_REPORT_PROFILES) {
      return NextResponse.json(
        { error: `Please filter results to ${MAX_REPORT_PROFILES} profiles or fewer.` },
        { status: 400 }
      );
    }

    const summary = await generateReportSummary(profiles);
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
