import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = { message: "Invalid response" };
    }

    const response = NextResponse.json(data, { status: res.status });
    const headerBag = res.headers as unknown as { getSetCookie?: () => string[] };
    const setCookies = headerBag.getSetCookie?.() ?? [];

    if (setCookies.length === 0) {
      for (const [name, value] of res.headers.entries()) {
        if (name.toLowerCase() === "set-cookie") {
          setCookies.push(value);
        }
      }
    }

    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal login admin", error: String(error) },
      { status: 500 },
    );
  }
}
