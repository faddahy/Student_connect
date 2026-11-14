import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";

export function LegalShell({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/"><Logo small /></Link>
      <h1 className="mt-8 text-3xl font-extrabold tracking-tight">{title}</h1>
      {updated && <p className="mt-1 text-sm text-ink/50">Last updated: {updated}</p>}
      <article className="prose-legal mt-4">{children}</article>
      <Footer />
    </main>
  );
}
