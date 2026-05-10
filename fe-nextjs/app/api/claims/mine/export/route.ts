import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bagi_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BACKEND}/api/claims/mine/export`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/csv" },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ message: "Gagal mengekspor klaim" }, { status: res.status });
  }

  const blob = await res.blob();
  const filename = `klaim-saya-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
