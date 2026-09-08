import { createFileRoute } from "@tanstack/react-router";

// The Pitch Capital PHP API sends a duplicated `Access-Control-Allow-Origin: *, *`
// header, which every browser rejects ("Failed to fetch"). We cannot change that
// server, so all browser calls are forwarded through this same-origin proxy —
// server-to-server requests are not subject to CORS.
const UPSTREAM = "https://pitchcapital.ng/api";

async function forward({ request, params }: { request: Request; params: { _splat?: string } }) {
  const incoming = new URL(request.url);
  const path = params._splat ?? "";
  const target = `${UPSTREAM}/${path}${incoming.search}`;

  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return new Response(
      JSON.stringify({ error: "Cannot reach the Pitch Capital server. Please try again." }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const body = await upstream.arrayBuffer();
  const out = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);
  out.set("cache-control", "no-store");
  return new Response(body, { status: upstream.status, headers: out });
}

export const Route = createFileRoute("/api/public/pc/$")({
  server: {
    handlers: {
      GET: forward,
      POST: forward,
      PUT: forward,
      PATCH: forward,
      DELETE: forward,
    },
  },
});
