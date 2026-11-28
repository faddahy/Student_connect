import Link from "next/link";
import { paidPlayPayout } from "@/lib/engine";
import { naira } from "@/lib/format";

export const metadata = { title: "Games" };

export default function GamesPage() {
  const sample = paidPlayPayout(500, 4);
  return (
    <main className="px-4">
      <h1 className="text-2xl font-extrabold">Games</h1>
      <p className="mt-1 text-sm text-ink/55">Whot and Ludo only. Free tables, or paid tables from ₦100 to ₦1,000.</p>
      <div className="mt-4 grid gap-3">
        <Link href="/games/whot" className="card block">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Card game</p>
          <h2 className="mt-1 text-xl font-black">Whot</h2>
          <p className="mt-1 text-sm text-ink/65">Shapes, Pick 2, Hold On, General Market, and the Whot wild card. Play the AI or pass the phone.</p>
        </Link>
        <Link href="/games/ludo" className="card block">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-200">Board game</p>
          <h2 className="mt-1 text-xl font-black">Ludo</h2>
          <p className="mt-1 text-sm text-ink/65">Four tokens, a 6 to leave the yard, captures, safe squares, and an exact roll home.</p>
        </Link>
      </div>
      <section className="card mt-4 text-sm">
        <h2 className="font-bold">Paid table example · {naira(500)} × 4</h2>
        <p className="mt-2 text-ink/70">{"D'Luck"} keeps 1% ({naira(sample.faddahyFee)}). The host takes 30% of the net ({naira(sample.organizer)}). The winner takes 70% ({naira(sample.winner)}).</p>
      </section>
    </main>
  );
}
