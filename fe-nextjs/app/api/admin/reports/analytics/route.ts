import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bagi_token")?.value;
  const search = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/api/admin/reports/analytics${search ? `?${search}` : ""}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
