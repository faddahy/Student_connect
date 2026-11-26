import { WhotBoard } from "@/components/games/WhotBoard";

const RULES = [
  "Shapes: circle, triangle, cross, square, star.",
  "1 is Hold On and skips the next player.",
  "2 is Pick 2. Another 2 stacks it.",
  "14 is General Market. Everyone else draws one.",
  "Whot is wild. Call the shape the next player must follow.",
];

export const metadata = { title: "Whot" };

export default function WhotPage() {
  return (
    <main className="px-4">
      <h1 className="text-2xl font-extrabold">Whot</h1>
      <ul className="mt-2 mb-4 list-disc space-y-1 pl-5 text-sm text-ink/60">
        {RULES.map((rule) => <li key={rule}>{rule}</li>)}
      </ul>
      <WhotBoard />
    </main>
  );
}
