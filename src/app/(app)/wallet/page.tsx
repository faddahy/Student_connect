import { WalletPanel } from "@/components/social/WalletPanel";
import { personByUsername } from "@/lib/demo/data";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const session = await requireUser();
  const person = session.persona ?? personByUsername(session.profile?.username || "ada") ?? personByUsername("ada")!;
  return (
    <main className="px-4">
      <h1 className="mb-4 text-2xl font-extrabold">Wallet</h1>
      <WalletPanel person={person} />
    </main>
  );
}
