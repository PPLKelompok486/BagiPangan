import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ donationId: string }> },
) {
  try {
    const { donationId } = await context.params;
    if (!donationId || Number.isNaN(Number(donationId))) {
      return NextResponse.json({ message: "ID donasi tidak valid." }, { status: 400 });
    }

    const body = await request.json();
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ message: "Alasan penolakan wajib diisi." }, { status: 422 });
    }

    const res = await fetch(`${API_BASE}/admin/moderation/${donationId}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({ reason }),
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = { message: "Invalid response" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menolak donasi", error: String(error) },
      { status: 500 },
    );
  }
}
