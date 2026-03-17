import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function GET(request: Request) {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: "missing_authorization_header" },
      { status: 401 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "missing_supabase_env" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user?.id) {
    return NextResponse.json(
      { user_id: null, status: "unauthenticated" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { user_id: data.user.id, status: "authenticated" },
    { status: 200 },
  );
}

