import { ProfileInput } from "./schema";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const systemPrompt = `You extract scholar profile fields from a Facebook post.
Return a single JSON object with keys:
name, visaType, interviewDate, status, university, program, subject, fundingStatus,
intake, universityName, cgpa, gre, ieltsOther, researchPublication, workExperience.

Field meaning:
- university = Intended University
- universityName = Studied University

Normalization rules:
- program must be only "MSc" or "PhD" (empty string if unknown).
- subject must be the degree subject only (e.g., "Electrical and Computer Engineering").
- fundingStatus must be "Full" if funding is full (full tuition waiver, assistantship, scholarship, full funding, etc.).
- cgpa must be numeric only (e.g., "3.78" from "3.78 out of 4.00").
- gre must be numeric only (e.g., "320"). If only "GRE: Yes" then return empty string.
- ieltsOther must be numeric only (e.g., "7.5" or "103" for TOEFL). Use score only, no labels.

If any field is missing, return an empty string for that field.
Do not include markdown or code fences.`;

function extractNumber(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : "";
}

function normalizeProgram(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("phd")) return "PhD";
  if (
    normalized.includes("msc") ||
    normalized.includes("m.sc") ||
    normalized.includes("ms") ||
    normalized.includes("master")
  ) {
    return "MSc";
  }
  return "";
}

function extractLabeledValue(text: string, label: string) {
  const regex = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n]+)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function extractSubjectFromProgram(value: string) {
  const match = value.match(/\b(?:phd|msc|m\.sc|ms|master\'?s?)\b\s+in\s+([^,.;\n]+)/i);
  return match ? match[1].trim() : "";
}

function extractStudiedUniversity(text: string) {
  const labeled = extractLabeledValue(text, "studied university");
  if (labeled) return labeled;

  const degreeMatch = text.match(
    /(?:B\.?Sc\.?|Bachelors?|Bachelor|B\.?E\.?|B\.?Eng|B\.?Tech|M\.?Sc\.?|Masters?|M\.?Eng|M\.?Tech)[^\n]*\n([^\n]+)/i
  );
  return degreeMatch ? degreeMatch[1].trim() : "";
}

function normalizeFunding(value: string, rawText: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("full")) return "Full";
  const text = rawText.toLowerCase();
  if (
    (text.includes("full") || text.includes("fully") || text.includes("100%")) &&
    (text.includes("tuition") ||
      text.includes("assistantship") ||
      text.includes("scholarship") ||
      text.includes("funding") ||
      text.includes("waiver") ||
      text.includes("stipend") ||
      text.includes("i-20") ||
      text.includes("surplus"))
  ) {
    return "Full";
  }
  return "";
}

function normalizeParsed(parsed: Partial<ProfileInput>, rawText: string) {
  const programRaw = parsed.program || extractLabeledValue(rawText, "program") || "";
  const program = normalizeProgram(programRaw) || normalizeProgram(rawText);
  const subject =
    parsed.subject ||
    extractLabeledValue(rawText, "subject") ||
    extractSubjectFromProgram(programRaw) ||
    extractSubjectFromProgram(rawText);

  const cgpa = parsed.cgpa || extractLabeledValue(rawText, "cgpa");
  const gre = parsed.gre || extractLabeledValue(rawText, "gre");
  const ielts = parsed.ieltsOther || extractLabeledValue(rawText, "ielts");
  const toefl = extractLabeledValue(rawText, "toefl");
  const intendedUniversity =
    parsed.university || extractLabeledValue(rawText, "intended university");
  const studiedUniversity =
    parsed.universityName || extractStudiedUniversity(rawText);

  return {
    ...parsed,
    program,
    subject,
    university: intendedUniversity,
    universityName: studiedUniversity,
    fundingStatus: normalizeFunding(parsed.fundingStatus || "", rawText),
    cgpa: extractNumber(cgpa),
    gre: extractNumber(gre),
    ieltsOther: extractNumber(ielts || toefl)
  } as Partial<ProfileInput>;
}

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
    const parsed = JSON.parse(content) as Partial<ProfileInput>;
    return normalizeParsed(parsed, text);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq returned non-JSON content");
    }
    const parsed = JSON.parse(match[0]) as Partial<ProfileInput>;
    return normalizeParsed(parsed, text);
  }
}
