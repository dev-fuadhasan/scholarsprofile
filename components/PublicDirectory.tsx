"use client";

import { useEffect, useMemo, useState } from "react";

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

const filterFields: { key: keyof Profile; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "visaType", label: "Visa Type" },
  { key: "university", label: "University" },
  { key: "program", label: "Program" },
  { key: "subject", label: "Subject" },
  { key: "fundingStatus", label: "Funding" },
  { key: "intake", label: "Intake" },
  { key: "universityName", label: "University Name" },
  { key: "gre", label: "GRE" },
  { key: "ieltsOther", label: "IELTS/Other" },
  { key: "researchPublication", label: "Research" },
  { key: "workExperience", label: "Work Experience" }
];

export default function PublicDirectory() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(Object.fromEntries(filterFields.map((field) => [field.key, ""])));
  const [maxCgpa, setMaxCgpa] = useState("");
  const [maxIelts, setMaxIelts] = useState("");
  const [maxGre, setMaxGre] = useState("");

  useEffect(() => {
    fetch("/api/public/profiles", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => setProfiles([]));
  }, []);

  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    filterFields.forEach((field) => {
      map[field.key] = Array.from(new Set(profiles.map((profile) => profile[field.key]).filter(Boolean))).sort();
    });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const cgpaLimit = maxCgpa ? Number.parseFloat(maxCgpa) : null;
    const ieltsLimit = maxIelts ? Number.parseFloat(maxIelts) : null;
    const greLimit = maxGre ? Number.parseFloat(maxGre) : null;
    return profiles.filter((profile) => {
      const matchesQuery = Object.values(profile).some((value) => value?.toString().toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (cgpaLimit !== null) {
        const value = Number.parseFloat(profile.cgpa || "");
        if (Number.isNaN(value) || value > cgpaLimit) return false;
      }
      if (ieltsLimit !== null) {
        const value = Number.parseFloat(profile.ieltsOther || "");
        if (Number.isNaN(value) || value > ieltsLimit) return false;
      }
      if (greLimit !== null) {
        const value = Number.parseFloat(profile.gre || "");
        if (Number.isNaN(value) || value > greLimit) return false;
      }
      return filterFields.every((field) => {
        const selected = filters[field.key];
        if (!selected) return true;
        return profile[field.key] === selected;
      });
    });
  }, [profiles, query, filters, maxCgpa, maxIelts, maxGre]);

  const ordered = [...filtered].sort((a, b) => {
    const left = new Date(a.createdAt).getTime();
    const right = new Date(b.createdAt).getTime();
    return right - left;
  });

  return (
    <section className="card p-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Filters</h2>
            <p className="text-xs text-slate-400">Narrow down by any field.</p>
          </div>
          <label className="text-sm text-slate-300">
            Max CGPA (<=)
            <input
              className="input mt-2"
              inputMode="decimal"
              placeholder="e.g. 3.5"
              value={maxCgpa}
              onChange={(event) => setMaxCgpa(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            Max IELTS (<=)
            <input
              className="input mt-2"
              inputMode="decimal"
              placeholder="e.g. 7.5"
              value={maxIelts}
              onChange={(event) => setMaxIelts(event.target.value)}
            />
          </label>
          <label className="text-sm text-slate-300">
            Max GRE (<=)
            <input
              className="input mt-2"
              inputMode="decimal"
              placeholder="e.g. 320"
              value={maxGre}
              onChange={(event) => setMaxGre(event.target.value)}
            />
          </label>
          {filterFields.map((field) => (
            <label key={field.key} className="text-sm text-slate-300">
              {field.label}
              <select
                className="input mt-2"
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
          <button
            className="btn-ghost"
            onClick={() => {
              setFilters(Object.fromEntries(filterFields.map((field) => [field.key, ""])));
              setMaxCgpa("");
              setMaxIelts("");
              setMaxGre("");
            }}
          >
            Clear Filters
          </button>
        </aside>

        <div>
          <input
            className="input"
            placeholder="Search by name, university, program, subject..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="mt-6 grid gap-4">
            {ordered.map((profile) => (
              <article key={profile.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
                  <span className="badge">{profile.status || "Status"}</span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <p>University: {profile.university || "-"}</p>
                  <p>Program: {profile.program || "-"}</p>
                  <p>Subject: {profile.subject || "-"}</p>
                  <p>Intake: {profile.intake || "-"}</p>
                  <p>Funding: {profile.fundingStatus || "-"}</p>
                  <p>Visa Type: {profile.visaType || "-"}</p>
                  <p>Interview Date: {profile.interviewDate || "-"}</p>
                  <p>CGPA: {profile.cgpa || "-"}</p>
                  <p>GRE: {profile.gre || "-"}</p>
                  <p>IELTS/Other: {profile.ieltsOther || "-"}</p>
                  <p>Research: {profile.researchPublication || "-"}</p>
                  <p>Work Experience: {profile.workExperience || "-"}</p>
                </div>
              </article>
            ))}
            {!ordered.length && (
              <p className="text-center text-slate-400">No profiles found. Try adjusting filters.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
