import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/reports/export/csv`, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    const csv = await res.text();

    return new NextResponse(csv, {
      status: res.status,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="donation-report.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengunduh laporan CSV", error: String(error) },
      { status: 500 },
    );
  }
}
