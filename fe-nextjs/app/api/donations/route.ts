import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Forward the request to the backend Laravel API
  const formData = await req.formData();
  const token = req.cookies.get("bagi_token")?.value;
  const authHeader = req.headers.get("authorization");
  const backendUrl = process.env.BAGIPANGAN_BACKEND_URL || "http://localhost:8000";

  const res = await fetch(`${backendUrl}/api/donations`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    console.error("Donations proxy failed", { status: res.status, data });
  }

  return new NextResponse(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  // List/Show donasi
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const token = req.cookies.get("bagi_token")?.value;
  const authHeader = req.headers.get("authorization");
  const backendUrl = process.env.BAGIPANGAN_BACKEND_URL || "http://localhost:8000";
  const url = id ? `${backendUrl}/api/donations/${id}` : `${backendUrl}/api/donations`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    console.error("Donations proxy failed", { status: res.status, data });
  }

  return new NextResponse(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

