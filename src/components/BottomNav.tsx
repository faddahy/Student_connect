"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/discover", label: "Discover", icon: "M12 21s-7.5-4.6-10-9.3C.4 8.6 2.2 4.5 6 4.1c2.1-.2 3.6 1 4.4 2.2l1.6 2 1.6-2c.8-1.2 2.3-2.4 4.4-2.2 3.8.4 5.6 4.5 4 7.6C19.5 16.4 12 21 12 21z" },
  { href: "/matches", label: "Matches", icon: "M4 5h16v11H8l-4 4V5z" },
  { href: "/profile", label: "Profile", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0H4z" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/90 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/") || (it.href === "/matches" && path.startsWith("/chat"));
          return (
            <Link key={it.href} href={it.href} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold ${active ? "text-brand-600" : "text-ink/50"}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path d={it.icon} strokeLinejoin="round" />
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
