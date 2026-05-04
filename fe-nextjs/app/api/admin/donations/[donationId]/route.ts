import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

export async function GET(request: NextRequest, context: { params: { donationId: string } }) {
  try {
    const donationId = context.params.donationId;
    if (!donationId || Number.isNaN(Number(donationId))) {
      return NextResponse.json(
        { message: "ID donasi tidak valid." },
        { status: 400 },
      );
    }
    const res = await fetch(`${API_BASE}/admin/donations/${context.params.donationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
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
      { message: "Gagal mengambil detail donasi", error: String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: { donationId: string } }) {
  try {
    const donationId = context.params.donationId;
    if (!donationId || Number.isNaN(Number(donationId))) {
      return NextResponse.json(
        { message: "ID donasi tidak valid." },
        { status: 400 },
      );
    }
    const body = await request.json();

    const res = await fetch(`${API_BASE}/admin/donations/${context.params.donationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(body),
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
      { message: "Gagal memperbarui donasi", error: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { donationId: string } }) {
  try {
    const donationId = context.params.donationId;
    if (!donationId || Number.isNaN(Number(donationId))) {
      return NextResponse.json(
        { message: "ID donasi tidak valid." },
        { status: 400 },
      );
    }
    const res = await fetch(`${API_BASE}/admin/donations/${context.params.donationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
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
      { message: "Gagal menghapus donasi", error: String(error) },
      { status: 500 },
    );
  }
}
