import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function GET() {
  if (!SUPABASE_URL || !(SERVICE_ROLE_KEY || PUBLIC_KEY)) {
    return NextResponse.json(
      { message: "Supabase belum terkonfigurasi" },
      { status: 500 },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY ?? PUBLIC_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("donation_categories")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: "Gagal memuat kategori", error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}
