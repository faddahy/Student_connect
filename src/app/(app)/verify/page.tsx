import { VerifyPanel } from "@/components/social/VerifyPanel";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Blue tick" };

export default async function VerifyPage() {
  const session = await requireUser();
  return (
    <main className="px-4">
      <h1 className="text-2xl font-extrabold">Blue tick</h1>
      <p className="mt-1 mb-4 text-sm text-ink/55">Manual bank transfer. A founder approves the receipt before the tick turns on.</p>
      <VerifyPanel initialRegion={session.persona?.region ?? "nigeria"} />
    </main>
  );
}
