import { APP_NAME } from "@/lib/config";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-md shadow-brand-500/30 ${small ? "h-8 w-8" : "h-10 w-10"}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className={small ? "h-4 w-4" : "h-5 w-5"}>
          <path d="M12 21s-7.5-4.6-10-9.3C.4 8.6 2.2 4.5 6 4.1c2.1-.2 3.6 1 4.4 2.2l1.6 2 1.6-2c.8-1.2 2.3-2.4 4.4-2.2 3.8.4 5.6 4.5 4 7.6C19.5 16.4 12 21 12 21z" />
        </svg>
      </span>
      <span className={`font-extrabold tracking-tight ${small ? "text-lg" : "text-xl"}`}>{APP_NAME}</span>
    </span>
  );
}
