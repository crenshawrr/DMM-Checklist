import { NextResponse } from "next/server";

const MAINTENANCE_PATH = "/maintenance";

function isPublicAsset(pathname) {
  // Next.js internal assets
  if (pathname.startsWith("/_next/")) return true;

  // Common public files
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;

  // Allow typical static assets (so your maintenance page can load images/fonts)
  return /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|woff|woff2|ttf)$/i.test(
    pathname
  );
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Toggle with env var
  const maintenanceOn = process.env.MAINTENANCE_MODE === "true";
  if (!maintenanceOn) return NextResponse.next();

  // Allow the maintenance route itself + assets
  if (pathname === MAINTENANCE_PATH) return NextResponse.next();
  if (isPublicAsset(pathname)) return NextResponse.next();

  // 503 maintenance response
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Maintenance</title>
  <meta name="robots" content="noindex,nofollow" />
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#0b0f19;color:#e6e8ee}
    .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:560px;width:100%;background:#121a2a;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
    h1{margin:0 0 12px;font-size:28px}
    p{margin:0 0 8px;line-height:1.5;color:#b8c0d6}
    .hint{margin-top:18px;font-size:13px;color:#8f9ab6}
    .code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;background:rgba(255,255,255,.06);padding:2px 6px;border-radius:6px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>🛠️ Maintenance Mode</h1>
      <p>We’re doing some updates right now.</p>
      <p>Please check back soon.</p>
      <div class="hint">
        If you’re the site owner, visit <span class="code">${MAINTENANCE_PATH}</span>.
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      // "Retry-After": "300",
    },
  });
}

export const config = {
  matcher: "/:path*",
};
