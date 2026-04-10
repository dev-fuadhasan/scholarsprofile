"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyProfile } from "../lib/schema";

type Profile = ReturnType<typeof emptyProfile> & { id?: string };

const fields: { key: keyof Profile; label: string; multiline?: boolean }[] = [
  { key: "name", label: "Name" },
  { key: "visaType", label: "Visa Type" },
  { key: "interviewDate", label: "Interview Date" },
  { key: "status", label: "Status" },
  { key: "university", label: "University" },
  { key: "program", label: "Program" },
  { key: "subject", label: "Subject" },
  { key: "fundingStatus", label: "Funding Status" },
  { key: "intake", label: "Intake" },
  { key: "universityName", label: "University Name" },
  { key: "cgpa", label: "CGPA" },
  { key: "gre", label: "GRE" },
  { key: "ieltsOther", label: "IELTS/Other" },
  { key: "researchPublication", label: "Research/Publications", multiline: true },
  { key: "workExperience", label: "Work Experience", multiline: true },
  { key: "facebookProfileUrl", label: "Facebook Profile URL (private)" },
  { key: "rawPost", label: "Raw Post", multiline: true }
];

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [postText, setPostText] = useState("");
  const [manualName, setManualName] = useState("");
  const [facebookProfileUrl, setFacebookProfileUrl] = useState("");
  const [preview, setPreview] = useState<Profile | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Profile>(emptyProfile());

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) || null,
    [profiles, selectedId]
  );

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => res.json())
      .then((data) => setIsAuthed(Boolean(data.ok)))
      .catch(() => setIsAuthed(false));
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    fetchProfiles();
  }, [isAuthed]);

  useEffect(() => {
    if (!selectedProfile) return;
    setFormData(selectedProfile);
  }, [selectedProfile]);

  const fetchProfiles = async () => {
    const res = await fetch("/api/admin/profiles");
    const data = await res.json();
    setProfiles(data.profiles || []);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Login failed");
      return;
    }

    setIsAuthed(true);
  };

  const handleParse = async () => {
    setError("");
    const res = await fetch("/api/admin/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postText, name: manualName, facebookProfileUrl })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Parse failed");
      return;
    }

    setPreview(data.profile);
  };

  const handleSavePreview = async () => {
    if (!preview) return;
    setError("");
    const res = await fetch("/api/admin/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preview)
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }

    setPreview(null);
    setPostText("");
    setManualName("");
    setFacebookProfileUrl("");
    await fetchProfiles();
  };

  const handleUpdate = async () => {
    if (!selectedProfile?.id) return;
    setError("");
    const res = await fetch("/api/admin/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, id: selectedProfile.id })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }

    setProfiles((prev) => prev.map((profile) => (profile.id === data.profile.id ? data.profile : profile)));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/admin/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }

    setProfiles((prev) => prev.filter((profile) => profile.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  if (!isAuthed) {
    return (
      <main className="container py-12">
        <section className="card p-8 max-w-lg">
          <h1 className="text-2xl font-display">Admin Login</h1>
          <p className="text-slate-400 mt-2">Use the admin credentials from your env.</p>
          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <input className="input" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button className="btn-primary" type="submit">Login</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="container py-12">
      <header className="mb-10">
        <span className="badge">Admin</span>
        <h1 className="mt-4 text-3xl font-display">Manage Scholar Profiles</h1>
        <p className="mt-2 text-slate-400">Paste a Facebook post, review parsed data, and publish profiles.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Parse Facebook Post</h2>
          <div className="mt-4 grid gap-3">
            <input className="input" placeholder="Student name (manual)" value={manualName} onChange={(event) => setManualName(event.target.value)} />
            <input className="input" placeholder="Facebook profile URL (private)" value={facebookProfileUrl} onChange={(event) => setFacebookProfileUrl(event.target.value)} />
            <textarea className="input min-h-[140px]" placeholder="Paste Facebook post here" value={postText} onChange={(event) => setPostText(event.target.value)} />
            <button className="btn-primary" onClick={handleParse}>Parse with Groq</button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Parsed Preview</h2>
          {!preview && <p className="mt-4 text-slate-400">No preview yet.</p>}
          {preview && (
            <div className="mt-4 grid gap-2 text-sm text-slate-300">
              {fields.map((field) => (
                <p key={field.key}>
                  <span className="text-slate-400">{field.label}:</span> {preview[field.key] || "-"}
                </p>
              ))}
              <button className="btn-primary mt-3" onClick={handleSavePreview}>Save Profile</button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card p-5">
          <h3 className="text-lg font-semibold">Existing Profiles</h3>
          <div className="mt-4 grid gap-2 max-h-[520px] overflow-y-auto">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${selectedId === profile.id ? "border-cyan-400 text-cyan-300" : "border-slate-800 text-slate-300 hover:border-slate-600"}`}
                onClick={() => setSelectedId(profile.id || null)}
              >
                <p className="font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-slate-400">{profile.status || "Status"}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold">Edit Profile</h3>
          {!selectedProfile && <p className="mt-3 text-slate-400">Select a profile to edit.</p>}
          {selectedProfile && (
            <div className="mt-4 grid gap-4">
              {fields.map((field) => (
                <label key={field.key} className="text-sm text-slate-300">
                  {field.label}
                  {field.multiline ? (
                    <textarea
                      className="input mt-2 min-h-[90px]"
                      value={formData[field.key] || ""}
                      onChange={(event) => setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  ) : (
                    <input
                      className="input mt-2"
                      value={formData[field.key] || ""}
                      onChange={(event) => setFormData((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={handleUpdate}>Save Changes</button>
                {selectedProfile.id && (
                  <button className="btn-ghost" onClick={() => handleDelete(selectedProfile.id!)}>Delete</button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
