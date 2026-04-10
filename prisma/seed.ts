import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import * as xlsx from "xlsx";

const prisma = new PrismaClient();

const COLUMN_MAP: Record<string, string> = {
  NAME: "name",
  "VISA TYPE": "visaType",
  "INTERVIEW DATE": "interviewDate",
  STATUS: "status",
  UNIVERSITY: "university",
  PROGRAM: "program",
  SUBJECT: "subject",
  "FUNDING STATUS": "fundingStatus",
  INTAKE: "intake",
  "UNIVERSITY NAME": "universityName",
  CGPA: "cgpa",
  GRE: "gre",
  "IELTS/Oth.": "ieltsOther",
  "RESEARCH / PUBLICATION": "researchPublication",
  "WORK EXPERIENCE": "workExperience"
};

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

async function main() {
  const excelPath =
    process.env.EXCEL_PATH ||
    path.join(process.cwd(), "Students Profile & Status.xlsx");

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found at ${excelPath}`);
  }

  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });

  const profiles = rows.map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(COLUMN_MAP).forEach(([excelKey, modelKey]) => {
      mapped[modelKey] = toText(row[excelKey]);
    });

    return {
      name: mapped.name || "",
      visaType: mapped.visaType || "",
      interviewDate: mapped.interviewDate || "",
      status: mapped.status || "",
      university: mapped.university || "",
      program: mapped.program || "",
      subject: mapped.subject || "",
      fundingStatus: mapped.fundingStatus || "",
      intake: mapped.intake || "",
      universityName: mapped.universityName || "",
      cgpa: mapped.cgpa || "",
      gre: mapped.gre || "",
      ieltsOther: mapped.ieltsOther || "",
      researchPublication: mapped.researchPublication || "",
      workExperience: mapped.workExperience || "",
      facebookProfileUrl: "",
      rawPost: ""
    };
  });

  const cleaned = profiles.filter((profile) => profile.name);

  await prisma.profile.deleteMany({});
  if (cleaned.length) {
    await prisma.profile.createMany({ data: cleaned });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
