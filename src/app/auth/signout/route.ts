import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set("fs_persona", "", { path: "/", maxAge: 0 });
  return response;
}
