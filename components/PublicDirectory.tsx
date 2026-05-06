"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Search, Filter, AlertCircle, University, Calendar, BookOpen, Banknote, FileText, Briefcase, Award } from "lucide-react";

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
  return value.trim();
}

function normalizeFunding(value: string) {
  return value.toLowerCase().includes("full") ? "Full" : "";
}

function extractNumber(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function deriveSubject(program: string) {
  const match = program.match(/\b(?:phd|msc|m\.sc|ms|master\'?s?)\b\s+in\s+([^,.;\n]+)/i);
  return match ? match[1].trim() : "";
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

        <div className="flex items-center justify-between text-sm text-slate-400 px-1">
          <span>Showing <strong className="text-white">{ordered.length}</strong> profiles</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {ordered.map((profile) => (
            <article 
              key={profile.id} 
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/40 hover:shadow-xl hover:shadow-cyan-900/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold tracking-tight text-white">{profile.name}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-cyan-400">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {normalizeProgram(profile.program) || profile.program || "Program"} 
                      {profile.subject || deriveSubject(profile.program) ? ` in ${profile.subject || deriveSubject(profile.program)}` : ""}
                    </span>
                  </div>
                </div>
                <span className="badge shrink-0 border-cyan-800 bg-cyan-950/50 text-cyan-300">
                  {profile.status || "Status"}
                </span>
              </div>

              <div className="my-5 h-px w-full bg-gradient-to-r from-slate-800 to-transparent" />

              <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div className="flex flex-col gap-1 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <University className="h-3.5 w-3.5" /> Intended
                  </span>
                  <span className="font-medium line-clamp-1" title={profile.university}>{profile.university || "-"}</span>
                </div>
                <div className="flex flex-col gap-1 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <Banknote className="h-3.5 w-3.5" /> Funding
                  </span>
                  <span className="font-medium text-emerald-400">{profile.fundingStatus || "-"}</span>
                </div>
                
                <div className="flex flex-col gap-1 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" /> Studied
                  </span>
                  <span className="font-medium line-clamp-1" title={profile.universityName}>{profile.universityName || "-"}</span>
                </div>
                <div className="flex flex-col gap-1 text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <Calendar className="h-3.5 w-3.5" /> Intake / Visa
                  </span>
                  <span className="font-medium">{profile.intake || "-"} / {profile.visaType || "-"}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-800/60">
                {profile.cgpa && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-800">
                    <span className="text-slate-500">CGPA</span> {profile.cgpa}
                  </span>
                )}
                {profile.gre && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-800">
                    <span className="text-slate-500">GRE</span> {profile.gre}
                  </span>
                )}
                {profile.ieltsOther && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-800">
                    <span className="text-slate-500">IELTS</span> {profile.ieltsOther}
                  </span>
                )}
              </div>
              
              {(profile.researchPublication || profile.workExperience) && (
                <div className="mt-3 grid gap-1.5 text-xs text-slate-400">
                  {profile.researchPublication && (
                    <div className="flex items-start gap-2">
                       <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                       <span className="line-clamp-2 leading-relaxed" title={profile.researchPublication}>{profile.researchPublication}</span>
                    </div>
                  )}
                  {profile.workExperience && (
                    <div className="flex items-start gap-2">
                       <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                       <span className="line-clamp-2 leading-relaxed" title={profile.workExperience}>{profile.workExperience}</span>
                    </div>
                  )}
                </div>
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
