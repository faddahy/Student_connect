import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { isAdminEmail } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const { profile, user } = session;
  if (profile?.is_banned) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Account suspended</h1>
        <p className="mt-2 text-ink/60">This account was suspended for breaking the Community Guidelines.</p>
        <form action="/auth/signout" method="post" className="mt-6"><button className="btn-ghost">Sign out</button></form>
      </main>
    );
  }
  if (!profile?.onboarded) redirect("/onboarding");
  if (!session.demo && session.supabase) {
    await session.supabase.from("profiles").update({ last_active: new Date().toISOString() }).eq("id", user.id);
  }
  const admin = session.demo ? Boolean(session.persona?.admin) : isAdminEmail(user.email);
  const persona = session.persona?.username;

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-navy/90 px-4 py-3 backdrop-blur">
        <Link href="/feed"><Logo small /></Link>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {session.demo && (
            <span className="hidden text-ink/40 sm:inline">Demo</span>
          )}
          {session.demo && (
            <span className="flex gap-1">
              {(["ada", "tunde", "yagyok"] as const).map((id) => (
                <a key={id} href={`/api/demo/persona?as=${id}&next=/feed`} className={`chip px-2 py-1 text-[11px] ${persona === id ? "chip-on" : ""}`}>
                  {id === "yagyok" ? "@yagyok" : id}
                </a>
              ))}
            </span>
          )}
          <Link href="/wallet" className="chip px-2 py-1 text-[11px]">Wallet</Link>
          <Link href="/secret" className="chip px-2 py-1 text-[11px]">18+</Link>
          {admin && <Link href="/admin" className="chip px-2 py-1 text-[11px]">Admin</Link>}
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
