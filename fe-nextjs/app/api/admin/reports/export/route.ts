import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();
    const targetUrl = query
      ? `${BACKEND_BASE_URL}/api/admin/reports/export?${query}`
      : `${BACKEND_BASE_URL}/api/admin/reports/export`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { message: text || "Gagal mengunduh laporan" };
      }
      return NextResponse.json(parsed, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "text/csv; charset=UTF-8";
    const disposition =
      res.headers.get("content-disposition") ?? `attachment; filename="donasi_export.csv"`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengunduh laporan", error: String(error) },
      { status: 500 },
    );
  }
}
