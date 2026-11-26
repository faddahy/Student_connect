import { KycCapture } from "@/components/social/KycCapture";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Identity camera" };

export default async function KycPage() {
  const session = await requireUser();
  return (
    <main className="px-4">
      <h1 className="text-2xl font-extrabold">Identity camera</h1>
      <p className="mt-1 mb-4 text-sm text-ink/55">Live capture only. Nigerians submit a selfie and NIN. Everyone else submits a selfie and a national ID.</p>
      <KycCapture nigerianDefault={session.persona?.nigerian ?? true} />
    </main>
  );
}
