import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";

const PEOPLE = new Set(["ada", "tunde", "yagyok"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/feed";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/feed";
  if (isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }
  const as = url.searchParams.get("as") || "ada";
  const persona = PEOPLE.has(as) ? as : "ada";
  const response = NextResponse.redirect(new URL(safeNext, url.origin));
  response.cookies.set("fs_persona", persona, { path: "/", sameSite: "lax" });
  return response;
}
