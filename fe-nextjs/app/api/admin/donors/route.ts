import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();
    const targetUrl = query
      ? `${BACKEND_BASE_URL}/api/admin/donors?${query}`
      : `${BACKEND_BASE_URL}/api/admin/donors`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil daftar donatur", error: String(error) },
      { status: 500 },
    );
  }
}
