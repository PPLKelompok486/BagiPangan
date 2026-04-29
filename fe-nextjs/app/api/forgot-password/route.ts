import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:8000/api/forgot-password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ message: "Gagal menghubungi server" }, { status: 500 });
  }
}
