export function FormStatus({ error, message }: { error?: string; message?: string }) {
  if (error) return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>;
  if (message) return <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">{message}</p>;
  return null;
}
