import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

export async function GET() {
  try {
    const upstream = await fetch(`${API_BASE}/donations/categories`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal memuat kategori", error: String(error) },
      { status: 500 },
    );
  }
}
