import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return { message: "Invalid response" };
  }
}

async function getCategoryId(context: RouteContext) {
  const { categoryId } = await context.params;
  if (!categoryId || Number.isNaN(Number(categoryId))) {
    return null;
  }

  return categoryId;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const categoryId = await getCategoryId(context);
    if (!categoryId) {
      return NextResponse.json({ message: "ID kategori tidak valid." }, { status: 400 });
    }

    const body = await request.json();
    const res = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
      method: "PATCH",
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
      { message: "Gagal memperbarui kategori", error: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const categoryId = await getCategoryId(context);
    if (!categoryId) {
      return NextResponse.json({ message: "ID kategori tidak valid." }, { status: 400 });
    }

    const res = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    return NextResponse.json(await readJson(res), { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menonaktifkan kategori", error: String(error) },
      { status: 500 },
    );
  }
}
