import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

const PROTECTED = [
  "/discover", "/matches", "/chat", "/profile", "/onboarding", "/admin",
  "/feed", "/games", "/anonymous", "/wallet", "/verify", "/kyc", "/u", "/groups", "/post", "/messages", "/secret",
];

const DEMO_PEOPLE = new Set(["ada", "tunde", "yagyok"]);

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (request.nextUrl.pathname === "/api/demo/persona") {
      const requested = request.nextUrl.searchParams.get("as") || "ada";
      const persona = DEMO_PEOPLE.has(requested) ? requested : "ada";
      const next = request.nextUrl.searchParams.get("next") || "/feed";
      const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/feed";
      const url = new URL(safe, request.url);
      const host = request.headers.get("host");
      if (host) url.host = host;
      const redirect = NextResponse.redirect(url);
      redirect.cookies.set("fs_persona", persona, { path: "/", sameSite: "lax" });
      return redirect;
    }
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}
