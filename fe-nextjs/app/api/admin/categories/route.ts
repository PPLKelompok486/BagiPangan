import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { message: "Invalid response" };
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();
    const targetUrl = query
      ? `${API_BASE}/admin/categories?${query}`
      : `${API_BASE}/admin/categories`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    return NextResponse.json(await readJson(res), { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal mengambil daftar kategori", error: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json(await readJson(res), { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal membuat kategori", error: String(error) },
      { status: 500 },
    );
  }
}
