import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
// Uploaded files are served from the Laravel public root (e.g. /uploads/...),
// not under /api — strip a trailing /api if present.
const ROOT = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL.slice(0, -"/api".length)
  : BACKEND_BASE_URL;

// Restrict the proxy to the public upload directory so it can't be used as an
// open relay to arbitrary backend paths.
const ALLOWED_ROOT = "uploads";

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const segments = path ?? [];

  if (segments[0] !== ALLOWED_ROOT || segments.some((s) => s === "..")) {
    return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
  }

  const target = `${ROOT}/${segments.map(encodeURIComponent).join("/")}`;

  try {
    const upstream = await fetch(target, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ message: "Gagal memuat gambar" }, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=3600");

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menghubungi server", error: String(error) },
      { status: 502 },
    );
  }
}
