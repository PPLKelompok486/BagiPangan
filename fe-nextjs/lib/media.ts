/**
 * Resolve a backend-stored upload path (e.g. "/uploads/avatars/x.jpg") to a
 * same-origin URL served through the Next.js media proxy (app/api/media).
 *
 * The browser never talks to the Laravel host directly, so uploaded images and
 * proof photos load correctly in every deployment (local, Azure, …) without
 * relying on a NEXT_PUBLIC_* base URL being baked in at build time. Earlier code
 * referenced `process.env.LARAVEL_API_BASE` from client components, which is
 * undefined in the browser and silently fell back to http://localhost:8000 —
 * breaking every image in production.
 *
 * Local previews (blob:/data:) and already-absolute URLs are passed through.
 */
export function resolveUploadUrl(path?: string | null): string {
  if (!path) return "";
  if (/^(blob:|data:|https?:\/\/)/i.test(path)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/api/media${clean}`;
}
