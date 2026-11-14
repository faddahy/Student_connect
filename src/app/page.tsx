import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { ALLOWED_EMAIL_DOMAINS, APP_NAME, SUPABASE_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  if (SUPABASE_URL) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/discover");
  }
  const features = [
    { e: "🎓", t: "Students only", d: `Every account is verified with an @${ALLOWED_EMAIL_DOMAINS[0]} email. No randoms, no outsiders.` },
    { e: "💘", t: "Mutual matches", d: "Swipe right on people you like. You can only chat when the feeling is mutual." },
    { e: "💬", t: "Real-time chat", d: "Instant messages with your matches, right in your browser. No app store needed." },
    { e: "🛡️", t: "Safety first", d: "18+ only. Report, block or unmatch anyone in one tap. Reports are reviewed by real people." },
  ];
  return (
    <main className="mx-auto max-w-md px-5 py-6 sm:max-w-2xl">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/login" className="font-semibold text-brand-600">Log in</Link>
      </header>

      <section className="mt-14 text-center">
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">For FUT Minna students · Gidan Kwano & Bosso</span>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Find your person <span className="bg-gradient-to-r from-brand-500 to-fuchsia-500 bg-clip-text text-transparent">on campus</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-lg text-ink/60">
          {APP_NAME} is the dating and friendship app made just for FUT Minna students. Free, verified, and safe.
        </p>
        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
          <Link href="/signup" className="btn-primary text-lg">Join with your student email</Link>
          <Link href="/login" className="btn-ghost">I already have an account</Link>
        </div>
        <p className="mt-3 text-xs text-ink/40">18+ only · 100% free</p>
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
          <li>1. Sign up with your school email and confirm it.</li>
          <li>2. Add a few photos, your department and level, and what you&apos;re into.</li>
          <li>3. Like or pass on students. Match when it&apos;s mutual, then chat.</li>
        </ol>
        <p className="mt-4 text-sm text-ink/50">Tip: add {APP_NAME} to your home screen from your browser menu for an app-like experience.</p>
      </section>

      <Footer />
    </main>
  );
}
