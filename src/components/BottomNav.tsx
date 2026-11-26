"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/feed", label: "Feed", icon: "M4 5h16v3H4V5zm0 5.5h16v3H4v-3zM4 16h10v3H4v-3z" },
  { href: "/discover", label: "Dates", icon: "M12 21s-7.5-4.6-10-9.3C.4 8.6 2.2 4.5 6 4.1c2.1-.2 3.6 1 4.4 2.2l1.6 2 1.6-2c.8-1.2 2.3-2.4 4.4-2.2 3.8.4 5.6 4.5 4 7.6C19.5 16.4 12 21 12 21z" },
  { href: "/games", label: "Play", icon: "M4 9h16v8a2 2 0 0 1-2 2h-2l-2-2h-4l-2 2H6a2 2 0 0 1-2-2V9zm3 2v2H5v2h2v2h2v-2h2v-2H9v-2H7zm8.5 1.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zm2.6 2.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" },
  { href: "/anonymous", label: "Anon", icon: "M12 3a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.8V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-3.2c1.8-1.3 3-3.4 3-5.8a7 7 0 0 0-7-7z" },
  { href: "/profile", label: "Me", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0H4z" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg justify-around">
        {items.map((item) => {
          const active =
            path === item.href ||
            path.startsWith(item.href + "/") ||
            (item.href === "/discover" && (path.startsWith("/matches") || path.startsWith("/chat"))) ||
            (item.href === "/games" && path.startsWith("/games"));
          return (
            <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${active ? "text-brand-200" : "text-ink/45"}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path d={item.icon} strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
