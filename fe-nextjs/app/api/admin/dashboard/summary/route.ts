import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/admin/dashboard/summary`, {
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
      { message: "Gagal mengambil ringkasan dashboard", error: String(error) },
      { status: 500 },
    );
  }
}
