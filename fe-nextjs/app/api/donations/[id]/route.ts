import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const formData = await req.formData();
  const token = req.cookies.get("bagi_token")?.value;
  const backendUrl = process.env.BAGIPANGAN_BACKEND_URL || "http://localhost:8000";

  const res = await fetch(`${backendUrl}/api/donations/${id}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  return new NextResponse(
    JSON.stringify(data),
    {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const token = req.cookies.get("bagi_token")?.value;
  const backendUrl = process.env.BAGIPANGAN_BACKEND_URL || "http://localhost:8000";

  const res = await fetch(`${backendUrl}/api/donations/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = res.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return new NextResponse(
    JSON.stringify(data),
    {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
