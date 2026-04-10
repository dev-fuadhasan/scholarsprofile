import PublicDirectory from "../components/PublicDirectory";

export default function HomePage() {
  return (
    <main className="container py-12">
      <section className="mb-10">
        <span className="badge">Scholars Directory</span>
        <h1 className="mt-4 text-4xl font-display tracking-tight">Explore Student Scholars Profiles</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Search and filter scholar profiles with rich, advanced filters. Admins can
          add new profiles by pasting Facebook posts and reviewing structured data.
        </p>
      </section>
      <PublicDirectory />
    </main>
  );
}
