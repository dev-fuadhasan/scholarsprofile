"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = {
  id: string;
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

  useEffect(() => {
    fetch("/api/public/profiles")
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
    return profiles.filter((profile) => {
      const matchesQuery = Object.values(profile).some((value) => value?.toString().toLowerCase().includes(q));
      if (!matchesQuery) return false;
      return filterFields.every((field) => {
        const selected = filters[field.key];
        if (!selected) return true;
        return profile[field.key] === selected;
      });
    });
  }, [profiles, query, filters]);

  return (
    <section className="card p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          className="input md:col-span-3"
          placeholder="Search by name, university, program, subject..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
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
      </div>

      <div className="mt-8 grid gap-4">
        {filtered.map((profile) => (
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
        {!filtered.length && (
          <p className="text-center text-slate-400">No profiles found. Try adjusting filters.</p>
        )}
      </div>
    </section>
  );
}
