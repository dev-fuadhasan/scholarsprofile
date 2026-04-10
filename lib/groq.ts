import { ProfileInput } from "./schema";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const systemPrompt = `You extract scholar profile fields from a Facebook post.
Return a single JSON object with keys:
name, visaType, interviewDate, status, university, program, subject, fundingStatus,
intake, universityName, cgpa, gre, ieltsOther, researchPublication, workExperience.
If any field is missing, return an empty string for that field.
Do not include markdown or code fences.`;

export async function parseProfileFromPost(text: string) {
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq error: ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";

  try {
    return JSON.parse(content) as Partial<ProfileInput>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq returned non-JSON content");
    }
    return JSON.parse(match[0]) as Partial<ProfileInput>;
  }
}
