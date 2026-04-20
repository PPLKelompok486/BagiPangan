import { NextRequest, NextResponse } from "next/server";

// Ganti URL berikut sesuai alamat backend Laravel Anda
const BACKEND_URL = "http://localhost:8000/api/register";

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
