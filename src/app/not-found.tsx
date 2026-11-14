import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl">💔</div>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <Link href="/" className="btn-primary mt-6">Go home</Link>
    </main>
  );
}
