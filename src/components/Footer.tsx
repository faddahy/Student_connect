import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 py-8 text-center text-sm text-ink/50">
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link href="/about">About</Link>
        <Link href="/guidelines">Community Guidelines</Link>
        <Link href="/terms">Terms of Use</Link>
        <Link href="/privacy">Privacy Policy</Link>
      </nav>
      <p className="mt-4">© {new Date().getFullYear()} {APP_NAME}. Text-first, and independent of any campus.</p>
    </footer>
  );
}
