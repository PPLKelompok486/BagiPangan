import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";
const API_BASE = BACKEND_BASE_URL.endsWith("/api")
  ? BACKEND_BASE_URL
  : `${BACKEND_BASE_URL}/api`;

const PASSTHROUGH_HEADERS = ["authorization", "content-type", "accept"] as const;

async function forward(req: NextRequest, segments: string[]) {
  const path = "/" + segments.map(encodeURIComponent).join("/");
  const search = req.nextUrl.search;
  const target = `${API_BASE}${path}${search}`;

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const method = req.method.toUpperCase();
  const init: RequestInit = { method, headers, redirect: "manual" };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    const responseHeaders = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);
    return new NextResponse(text, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Gagal menghubungi server", error: String(error) },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path ?? []);
}
