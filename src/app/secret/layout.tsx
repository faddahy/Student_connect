import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

/**
 * Secret Zone layout. This tree is ad-free: no third-party ad scripts are mounted here.
 */
export default function SecretLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24" data-secret-zone="ad-free">
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/feed"><Logo small /></Link>
        <Link href="/feed" className="text-sm font-semibold text-ink/60">Back</Link>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
