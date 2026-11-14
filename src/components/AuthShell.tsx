import Link from "next/link";
import { Logo } from "@/components/Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/" className="self-start"><Logo /></Link>
      <div className="mt-10">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-ink/60">{subtitle}</p>}
      </div>
      <div className="mt-8 flex-1">{children}</div>
      <p className="mt-10 text-center text-xs text-ink/50">
        <Link href="/terms" className="underline">Terms</Link> · <Link href="/privacy" className="underline">Privacy</Link> ·{" "}
        <Link href="/guidelines" className="underline">Community Guidelines</Link>
      </p>
    </main>
  );
}
