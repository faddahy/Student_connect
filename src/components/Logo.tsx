import { APP_NAME } from "@/lib/config";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid place-items-center rounded-2xl bg-brand-500 text-white ${small ? "h-8 w-8" : "h-10 w-10"}`}>
        <span className={`font-black ${small ? "text-sm" : "text-base"}`}>D</span>
      </span>
      <span className={`font-extrabold tracking-tight ${small ? "text-lg" : "text-xl"}`}>{APP_NAME}</span>
    </span>
  );
}
