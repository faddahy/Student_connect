import { LudoBoard } from "@/components/games/LudoBoard";

export const metadata = { title: "Ludo" };

export default function LudoPage() {
  return (
    <main className="px-4">
      <h1 className="mb-4 text-2xl font-extrabold">Ludo</h1>
      <LudoBoard />
    </main>
  );
}
