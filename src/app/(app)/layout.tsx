import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { isAdminEmail } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireUser();
  if (profile?.is_banned) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold">Account suspended</h1>
        <p className="mt-2 text-ink/60">Your account was suspended for breaking our Community Guidelines.</p>
        <form action="/auth/signout" method="post" className="mt-6"><button className="btn-ghost">Sign out</button></form>
      </main>
    );
  }
  if (!profile?.onboarded) redirect("/onboarding");
  // Lightweight "last active" ping (used to sort the discover feed).
  await supabase.from("profiles").update({ last_active: new Date().toISOString() }).eq("id", user.id);

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-[#fff7f9]/90 px-4 py-3 backdrop-blur">
        <Link href="/discover"><Logo small /></Link>
        {isAdminEmail(user.email) && <Link href="/admin" className="chip text-xs">Admin</Link>}
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
