import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;
const BACKEND_URL = `${API_BASE}/register`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("API Register - Request body:", body);
    
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Tambahkan header lain jika perlu (misal: Authorization)
      },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    console.log("API Register - Response status:", res.status);
    console.log("API Register - Response data:", data);
    
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("API Register - Error:", error);
    return NextResponse.json(
      { message: "Gagal menghubungi server", error: String(error) }, 
      { status: 500 }
    );
  }
}
