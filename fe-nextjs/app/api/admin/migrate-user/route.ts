import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * TEMPORARY migration endpoint — hapus setelah semua user lama sudah migrasi.
 * 
 * Cara pakai:
 * POST /api/admin/migrate-user
 * Body: { "secret": "bagi-migrate-2024", "email": "user@email.com", "password": "UserPassword123" }
 * 
 * Ini akan membuat user di Supabase Auth jika belum ada.
 */
export async function POST(req: NextRequest) {
  const MIGRATE_SECRET = process.env.MIGRATE_SECRET ?? "bagi-migrate-2024";
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY tidak dikonfigurasi di .env.local" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { secret, email, password } = body;

  if (secret !== MIGRATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "email dan password wajib diisi" }, { status: 400 });
  }

  // Gunakan service role key untuk membuat user di auth.users
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // langsung konfirmasi email
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: `User ${email} berhasil dibuat di Supabase Auth`,
    user_id: data.user?.id,
  });
}
