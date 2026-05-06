"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { GraduationCap, Search, Filter, AlertCircle, University, Calendar, BookOpen, Banknote, FileText, Briefcase, Download } from "lucide-react";

type Profile = {
  id: string;
  createdAt: string;
  name: string;
  visaType: string;
  interviewDate: string;
  status: string;
  university: string;
  program: string;
  subject: string;
  fundingStatus: string;
  intake: string;
  universityName: string;
  cgpa: string;
  gre: string;
  ieltsOther: string;
  researchPublication: string;
  workExperience: string;
};

function normalizeProgram(value: string | null | undefined) {
  if (!value) return "";
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
  return value.trim();
}

function normalizeFunding(value: string | null | undefined) {
  if (!value) return "";
  return value.toLowerCase().includes("full") ? "Full" : "";
}

function extractNumber(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function deriveSubject(program: string | null | undefined) {
  if (!program) return "";
  const match = program.match(/\b(?:phd|msc|m\.sc|ms|master\'?s?)\b\s+in\s+([^,.;\n]+)/i);
  return match ? match[1].trim() : "";
}

function formatReportValue(value: string | null | undefined) {
  if (!value) return "-";
  return value.trim() || "-";
}

const filterFields: { key: keyof Profile; label: string }[] = [
  { key: "visaType", label: "Visa Type" },
  { key: "university", label: "Intended University" },
  { key: "program", label: "Program" },
  { key: "subject", label: "Subject" },
  { key: "fundingStatus", label: "Funding" },
  { key: "intake", label: "Intake" },
  { key: "universityName", label: "Studied University" },
  { key: "researchPublication", label: "Research" },
  { key: "workExperience", label: "Work Experience" }
];

const createDefaultFilters = () =>
  Object.fromEntries(filterFields.map((field) => [field.key, ""])) as Record<string, string>;

export default function PublicDirectory() {
  const [profiles, setProfiles] = useState(() => [] as Profile[]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(() => createDefaultFilters() as Record<string, string>);
  const [maxCgpa, setMaxCgpa] = useState("");
  const [ieltsScore, setIeltsScore] = useState("");
  const [greScore, setGreScore] = useState("");

  useEffect(() => {
    fetch("/api/public/profiles", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => setProfiles([]));
  }, []);

  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    filterFields.forEach((field) => {
      if (field.key === "program") {
        map[field.key] = Array.from(
          new Set(
            profiles
              .map((profile) => normalizeProgram(profile.program))
              .filter((value) => value === "MSc" || value === "PhD")
          )
        ).sort();
        return;
      }

      if (field.key === "fundingStatus") {
        map[field.key] = Array.from(
          new Set(
            profiles
              .map((profile) => normalizeFunding(profile.fundingStatus))
              .filter((value) => value === "Full")
          )
        );
        return;
      }

      map[field.key] = Array.from(new Set(profiles.map((profile) => profile[field.key]).filter(Boolean))).sort();
    });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const cgpaLimit = maxCgpa ? Number.parseFloat(maxCgpa) : null;
    const ieltsExact = ieltsScore ? Number.parseFloat(ieltsScore) : null;
    const greExact = greScore ? Number.parseFloat(greScore) : null;
    return profiles.filter((profile) => {
      const matchesQuery = Object.values(profile).some((value) => value?.toString().toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (cgpaLimit !== null) {
        const value = Number.parseFloat(profile.cgpa || "");
        if (Number.isNaN(value) || value > cgpaLimit) return false;
      }
      if (ieltsExact !== null) {
        const value = extractNumber(profile.ieltsOther);
        if (value === null || Math.abs(value - ieltsExact) > 0.01) return false;
      }
      if (greExact !== null) {
        const value = extractNumber(profile.gre);
        if (value === null || Math.abs(value - greExact) > 0.01) return false;
      }
      return filterFields.every((field) => {
        const selected = filters[field.key];
        if (!selected) return true;
        if (field.key === "program") {
          return normalizeProgram(profile.program) === selected;
        }
        if (field.key === "fundingStatus") {
          return normalizeFunding(profile.fundingStatus) === selected;
        }
        return profile[field.key] === selected;
      });
    });
  }, [profiles, query, filters, maxCgpa, ieltsScore, greScore]);

  const ordered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return right - left;
    });
  }, [filtered]);

  const filterSummary = useMemo(() => {
    const summary: string[] = [];
    if (query.trim()) summary.push(`Search: ${query.trim()}`);
    if (maxCgpa.trim()) summary.push(`Max CGPA: ${maxCgpa.trim()}`);
    if (ieltsScore.trim()) summary.push(`IELTS: ${ieltsScore.trim()}`);
    if (greScore.trim()) summary.push(`GRE: ${greScore.trim()}`);
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const label = filterFields.find((field) => field.key === key)?.label ?? key;
      summary.push(`${label}: ${value}`);
    });
    return summary.length ? summary.join(" | ") : "None";
  }, [filters, greScore, ieltsScore, maxCgpa, query]);

  const handleGenerateReport = () => {
    if (!ordered.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(18);
    doc.text("Scholars Directory Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Filters: ${filterSummary}`, 40, 75, { maxWidth: pageWidth - 80 });

    let cursorY = 95;

    ordered.forEach((profile, index) => {
      if (cursorY > pageHeight - 180) {
        doc.addPage();
        cursorY = 40;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${formatReportValue(profile.name)}`, 40, cursorY);
      cursorY += 10;

      autoTable(doc, {
        startY: cursorY + 6,
        head: [["Field", "Value"]],
        body: [
          ["Program", formatReportValue(normalizeProgram(profile.program) || profile.program)],
          ["Subject", formatReportValue(profile.subject || deriveSubject(profile.program))],
          ["Intended University", formatReportValue(profile.university)],
          ["Studied University", formatReportValue(profile.universityName)],
          ["Funding", formatReportValue(profile.fundingStatus)],
          ["Intake", formatReportValue(profile.intake)],
          ["Visa", formatReportValue(profile.visaType)],
          ["Interview Date", formatReportValue(profile.interviewDate)],
          ["CGPA", formatReportValue(profile.cgpa)],
          ["GRE", formatReportValue(profile.gre)],
          ["IELTS/Other", formatReportValue(profile.ieltsOther)],
          ["Research", formatReportValue(profile.researchPublication)],
          ["Work Experience", formatReportValue(profile.workExperience)]
        ],
        styles: {
          fontSize: 9,
          cellPadding: 6,
          overflow: "linebreak",
          valign: "top"
        },
        headStyles: {
          fillColor: [8, 65, 79],
          textColor: [245, 248, 255],
          fontStyle: "bold"
        },
        columnStyles: {
          0: { cellWidth: 140, fontStyle: "bold" },
          1: { cellWidth: pageWidth - 200 }
        }
      });

      const tableInfo = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable;
      cursorY = (tableInfo?.finalY ?? cursorY) + 20;
    });

    doc.save(`scholars-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] items-start">
      {/* Sidebar Filters */}
      <aside className="sticky top-6 flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Filter className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold tracking-tight text-white">Filters</h2>
        </div>
        
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Max CGPA ({"<="})
            <input
              className="input bg-slate-950/50 block w-full py-2.5"
              inputMode="decimal"
              placeholder="e.g. 3.5"
              value={maxCgpa}
              onChange={(event) => setMaxCgpa(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            IELTS Score
            <input
              className="input bg-slate-950/50 block w-full py-2.5"
              inputMode="decimal"
              placeholder="e.g. 7.5"
              value={ieltsScore}
              onChange={(event) => setIeltsScore(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            GRE Score
            <input
              className="input bg-slate-950/50 block w-full py-2.5"
              inputMode="decimal"
              placeholder="e.g. 320"
              value={greScore}
              onChange={(event) => setGreScore(event.target.value)}
            />
          </label>
          
          <div className="my-2 h-px w-full bg-slate-800" />

          {filterFields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {field.label}
              <select
                className="input bg-slate-950/50 block w-full py-2.5 appearance-none"
                value={filters[field.key]}
                onChange={(event) => setFilters((prev) => ({ ...prev, [field.key]: event.target.value }))}
              >
                <option value="">All</option>
                {filterOptions[field.key]?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        
        <button
          className="btn-ghost mt-4 w-full py-2.5"
          onClick={() => {
            setFilters(createDefaultFilters());
            setMaxCgpa("");
            setIeltsScore("");
            setGreScore("");
          }}
        >
          Clear Filters
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        <div className="relative">
          <label className="sr-only">Search</label>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            className="input !rounded-2xl border-slate-700 bg-slate-900/60 py-4 pl-12 pr-4 text-base backdrop-blur-xl transition hover:border-slate-600 focus:border-cyan-500 shadow-sm"
            placeholder="Search by name, university, program, subject..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400 px-1">
          <span>Showing <strong className="text-white">{ordered.length}</strong> profiles</span>
          <button
            type="button"
            className="badge border-cyan-800 bg-cyan-950/50 text-cyan-300 hover:border-cyan-500 hover:text-cyan-200 transition disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleGenerateReport}
            disabled={!ordered.length}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Generate Report
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {ordered.map((profile) => (
            <article 
              key={profile.id} 
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 transition-all hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-xl hover:shadow-cyan-900/10"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold tracking-tight text-white">{profile.name}</h3>
                    <span className="badge shrink-0 border-cyan-800 bg-cyan-950/50 text-cyan-300">
                      {profile.status || "Status"}
                    </span>
                    {profile.fundingStatus && (
                      <span className="badge shrink-0 border-emerald-800 bg-emerald-950/50 text-emerald-300">
                        <Banknote className="mr-1.5 h-3.5 w-3.5" /> {profile.fundingStatus}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-cyan-400">
                    <GraduationCap className="h-5 w-5 shrink-0" />
                    <span>
                      {normalizeProgram(profile.program) || profile.program || "Program"} 
                      {profile.subject || deriveSubject(profile.program) ? ` in ${profile.subject || deriveSubject(profile.program)}` : ""}
                    </span>
                  </div>
                </div>
                
                {/* Scores */}
                <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                  {profile.cgpa && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-1.5 text-sm font-medium text-slate-200 border border-slate-800">
                      <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider">CGPA</span> {profile.cgpa}
                    </span>
                  )}
                  {profile.gre && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-1.5 text-sm font-medium text-slate-200 border border-slate-800">
                      <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider">GRE</span> {profile.gre}
                    </span>
                  )}
                  {profile.ieltsOther && (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-1.5 text-sm font-medium text-slate-200 border border-slate-800">
                      <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider">IELTS</span> {profile.ieltsOther}
                    </span>
                  )}
                </div>
              </div>

              <div className="my-6 h-px w-full bg-gradient-to-r from-slate-800 via-slate-800/50 to-transparent" />

              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                <div className="flex flex-col gap-1.5 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <University className="h-3.5 w-3.5" /> Intended University
                  </span>
                  <span className="font-medium text-slate-200">{profile.university || "-"}</span>
                </div>
                
                <div className="flex flex-col gap-1.5 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" /> Studied University
                  </span>
                  <span className="font-medium text-slate-200">{profile.universityName || "-"}</span>
                </div>

                <div className="flex flex-col gap-1.5 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <Calendar className="h-3.5 w-3.5" /> Intake / Visa
                  </span>
                  <span className="font-medium text-slate-200">
                    {profile.intake || "Unknown Intake"} <span className="text-slate-600 px-1">•</span> {profile.visaType || "Unknown Visa"}
                    {profile.interviewDate && ` (${profile.interviewDate})`}
                  </span>
                </div>
              </div>

              {/* Extended Text (Research & Experience) */}
              {(profile.researchPublication || profile.workExperience) && (
                <>
                  <div className="my-6 h-px w-full bg-slate-800/40" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                    {profile.researchPublication && (
                      <div className="flex flex-col gap-2 rounded-xl bg-slate-950/40 p-4 shrink-0 border border-slate-800/50">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <FileText className="h-3.5 w-3.5" /> Research & Publications
                        </span>
                        <span className="text-slate-300 leading-relaxed whitespace-pre-wrap">{profile.researchPublication}</span>
                      </div>
                    )}
                    {profile.workExperience && (
                      <div className="flex flex-col gap-2 rounded-xl bg-slate-950/40 p-4 shrink-0 border border-slate-800/50">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <Briefcase className="h-3.5 w-3.5" /> Work Experience
                        </span>
                        <span className="text-slate-300 leading-relaxed whitespace-pre-wrap">{profile.workExperience}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
          {!ordered.length && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 py-20 px-6 text-center">
              <AlertCircle className="mb-4 h-10 w-10 text-slate-500" />
              <h3 className="text-lg font-semibold text-white">No profiles found</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-400">
                We couldn't find any student profiles matching your current filters. Try adjusting or clearing them.
              </p>
              <button
                className="btn-ghost mt-6"
                onClick={() => {
                  setFilters(createDefaultFilters());
                  setMaxCgpa("");
                  setIeltsScore("");
                  setGreScore("");
                  setQuery("");
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
