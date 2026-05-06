import PublicDirectory from "../components/PublicDirectory";

export default function HomePage() {
  return (
    <main className="container py-12 md:py-20">
      <section className="mb-14 text-center md:text-left flex flex-col items-center justify-center md:items-start">
        <span className="badge mb-2 border-cyan-800 bg-cyan-950/50 text-cyan-300">Scholars Directory</span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
          Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Student Scholars</span> Profiles
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400 text-lg leading-relaxed">
          Search and filter scholar profiles with rich, advanced filters. Admins can
          add new profiles by pasting Facebook posts and reviewing structured data.
        </p>
      </section>
      <PublicDirectory />
    </main>
  );
}
