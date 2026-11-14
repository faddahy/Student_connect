export const metadata = { title: "Offline" };
export default function Offline() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl">📶</div>
      <h1 className="mt-4 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-ink/60">Check your data or Wi-Fi and try again.</p>
    </main>
  );
}
