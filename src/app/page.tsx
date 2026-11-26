import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { APP_NAME, isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/feed");
  }
  const features = [
    { e: "✎", t: "Text-first feed", d: "Original posts, read-only distributes, and quotes that cannot be quoted again." },
    { e: "✓", t: "Open sign-up", d: "Any Gmail or email can join. Every new account follows @yagyok." },
    { e: "₦", t: "Blue tick by transfer", d: "Regional prices, a manual receipt, and earning clocks the founder approves." },
    { e: "♠", t: "Whot and Ludo", d: "Free tables or paid tables with a 1% fee, 30% to the host, 70% to the winner." },
  ];
  return (
    <main className="mx-auto max-w-md px-5 py-6 sm:max-w-2xl">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/login" className="font-semibold text-brand-200">Log in</Link>
      </header>

      <section className="mt-14 text-center">
        <span className="inline-block rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-100">Free to host · Vercel + Supabase</span>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          A social app that stays <span className="text-brand-200">text-first</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-lg text-ink/60">
          {APP_NAME} keeps the main feed in words so it can live on free hosting. Dating, games, and the Secret Zone sit in their own rooms.
        </p>
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
          <Link href="/feed" className="btn-primary text-lg">Open the demo feed</Link>
          <Link href="/signup" className="btn-ghost">Create an account</Link>
        </div>
        <p className="mt-3 text-xs text-ink/40">18+ · Any email · You will follow @yagyok</p>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.t} className="card">
            <div className="text-3xl">{f.e}</div>
            <h3 className="mt-2 font-bold">{f.t}</h3>
            <p className="mt-1 text-sm text-ink/60">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="card mt-10">
        <h2 className="text-lg font-bold">How it works</h2>
        <ol className="mt-3 space-y-2 text-ink/70">
          <li>1. Sign up with any email. The database follows @yagyok for you.</li>
          <li>2. Capture a live selfie and ID, then send a bank receipt for the blue tick.</li>
          <li>3. Read the feed, play Whot or Ludo, and keep video out of the main timeline.</li>
        </ol>
        <p className="mt-4 text-sm text-ink/50">Tip: add {APP_NAME} to your home screen from your browser menu for an app-like experience.</p>
      </section>

      <Footer />
    </main>
  );
}
