import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";
import { photoUrl, REPORT_REASONS } from "@/lib/config";
import { banUser, setReportStatus, unbanUser } from "./actions";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type P = { id: string; email: string; display_name: string | null; photos: string[]; is_banned: boolean; bio: string | null };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  const tab = (await searchParams).tab === "all" ? "all" : "open";

  const admin = createAdminClient();
  let q = admin.from("reports").select("id,reporter,reported,reason,details,status,created_at").order("created_at", { ascending: false }).limit(100);
  if (tab === "open") q = q.eq("status", "open");
  const [{ data: reports }, { count: users }, { count: onboarded }, { count: matchCount }, { data: banned }] = await Promise.all([
    q,
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("onboarded", true),
    admin.from("matches").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id,email,display_name,photos,is_banned,bio").eq("is_banned", true).limit(100),
  ]);

  const ids = Array.from(new Set((reports ?? []).flatMap((r) => [r.reporter, r.reported])));
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id,email,display_name,photos,is_banned,bio").in("id", ids)
    : { data: [] as P[] };
  const byId = new Map((people as P[]).map((p) => [p.id, p]));
  const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Admin</h1>
        <Link href="/discover" className="chip">Back to app</Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[["Sign-ups", users], ["Profiles", onboarded], ["Matches", matchCount]].map(([k, v]) => (
          <div key={k as string} className="card text-center"><p className="text-2xl font-black">{v ?? 0}</p><p className="text-xs text-ink/50">{k}</p></div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Link href="/admin" className={`chip ${tab === "open" ? "chip-on" : "bg-white"}`}>Open reports</Link>
        <Link href="/admin?tab=all" className={`chip ${tab === "all" ? "chip-on" : "bg-white"}`}>All reports</Link>
      </div>

      <div className="mt-4 space-y-3">
        {(reports ?? []).length === 0 && <p className="card text-center text-ink/50">No reports 🎉</p>}
        {(reports ?? []).map((r) => {
          const target = byId.get(r.reported);
          const reporter = byId.get(r.reporter);
          return (
            <div key={r.id} className="card space-y-3">
              <div className="flex items-start gap-3">
                {target?.photos?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl(target.photos[0])} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{target?.display_name ?? "Deleted user"} {target?.is_banned && <span className="ml-1 rounded bg-red-100 px-1.5 text-xs text-red-700">BANNED</span>}</p>
                  <p className="truncate text-xs text-ink/50">{target?.email}</p>
                  <p className="mt-1 text-sm"><b>{reasonLabel(r.reason)}</b> · {new Date(r.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} · <span className="uppercase">{r.status}</span></p>
                  {r.details && <p className="mt-1 text-sm text-ink/70">“{r.details}”</p>}
                  <p className="mt-1 text-xs text-ink/40">Reported by {reporter?.email ?? "deleted user"}</p>
                </div>
              </div>
              {target?.bio && <p className="rounded-2xl bg-black/5 p-3 text-sm">{target.bio}</p>}
              <div className="flex flex-wrap gap-2">
                {target && !target.is_banned && (
                  <form action={banUser}><input type="hidden" name="userId" value={r.reported} /><button className="btn bg-red-600 py-2 text-sm text-white">Ban user</button></form>
                )}
                {r.status === "open" && (
                  <form action={setReportStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="dismissed" /><button className="btn-ghost py-2 text-sm">Dismiss</button></form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-lg font-bold">Banned users</h2>
      <div className="mt-3 space-y-2">
        {(banned as P[] | null)?.length ? (banned as P[]).map((b) => (
          <div key={b.id} className="card flex items-center justify-between py-3">
            <div className="min-w-0"><p className="font-semibold">{b.display_name ?? "—"}</p><p className="truncate text-xs text-ink/50">{b.email}</p></div>
            <form action={unbanUser}><input type="hidden" name="userId" value={b.id} /><button className="btn-ghost py-2 text-sm">Unban</button></form>
          </div>
        )) : <p className="text-sm text-ink/50">None.</p>}
      </div>
    </main>
  );
}
