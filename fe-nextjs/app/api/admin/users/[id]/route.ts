import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action");

    let targetUrl = `${BACKEND_BASE_URL}/api/admin/users/${id}`;
    if (action === "deactivate") {
      targetUrl = `${BACKEND_BASE_URL}/api/admin/users/${id}/deactivate`;
    } else if (action === "activate") {
      targetUrl = `${BACKEND_BASE_URL}/api/admin/users/${id}/activate`;
    }

    // Read payload if action is not deactivate/activate
    let body = undefined;
    if (!action) {
      try {
        body = JSON.stringify(await request.json());
      } catch {
        // no body
      }
    }

    const res = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body,
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal memperbarui pengguna", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetUrl = `${BACKEND_BASE_URL}/api/admin/users/${id}`;

    const res = await fetch(targetUrl, {
      method: "DELETE",
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
      { message: "Gagal menghapus pengguna", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action");

    if (action !== "restore") {
      return NextResponse.json({ message: "Metode tidak diizinkan" }, { status: 405 });
    }

    const targetUrl = `${BACKEND_BASE_URL}/api/admin/users/${id}/restore`;

    const res = await fetch(targetUrl, {
      method: "POST",
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
      { message: "Gagal memulihkan pengguna", error: String(error) },
      { status: 500 }
    );
  }
}
