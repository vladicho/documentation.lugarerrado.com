const EMBEDDED_ORIGIN = "https://embeddedsearchengine.lugarerrado.com";
const DOCUMENTATION_ORIGIN = "https://documentation.lugarerrado.com";

type SearchRow = {
  project: string;
  query: string;
  created_at: string;
};

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  return origin === EMBEDDED_ORIGIN || origin === DOCUMENTATION_ORIGIN ? origin : null;
}

function apiHeaders(request: Request): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  const origin = allowedOrigin(request);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
  }
  return headers;
}

function json(request: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: apiHeaders(request) });
}

function secure(response: Response): Response {
  const output = new Response(response.body, response);
  output.headers.set("X-Content-Type-Options", "nosniff");
  output.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  output.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  output.headers.set("X-Frame-Options", "SAMEORIGIN");
  return output;
}

async function searchHistory(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    if (!allowedOrigin(request)) return json(request, { ok: false }, 403);
    return new Response(null, { status: 204, headers: apiHeaders(request) });
  }

  if (request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT project, query, created_at FROM search_history ORDER BY created_at DESC LIMIT 1000",
    ).all<SearchRow>();
    const grouped: Record<string, Array<{ q: string; t: string }>> = {};
    for (const row of result.results) {
      (grouped[row.project] ||= []).push({ q: row.query, t: row.created_at });
    }
    return json(request, grouped);
  }

  if (!allowedOrigin(request)) return json(request, { ok: false, error: "Origem não autorizada." }, 403);

  if (request.method === "POST") {
    let input: { q?: unknown; projeto?: unknown };
    try {
      input = await request.json();
    } catch {
      return json(request, { ok: false, error: "JSON inválido." }, 400);
    }
    const query = typeof input.q === "string" ? input.q.trim() : "";
    const project = typeof input.projeto === "string" ? input.projeto.trim() : "";
    if (!query || !project || query.length > 200 || project.length > 80) {
      return json(request, { ok: false, error: "Pesquisa inválida." }, 400);
    }
    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO search_history (project, query, created_at) VALUES (?, ?, ?)",
    ).bind(project, query, now).run();
    return json(request, { ok: true, q: query, projeto: project, t: now }, 201);
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM search_history").run();
    return new Response(null, { status: 204, headers: apiHeaders(request) });
  }

  return json(request, { ok: false, error: "Método não permitido." }, 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/search-history") {
        return secure(await searchHistory(request, env));
      }
      return secure(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error(JSON.stringify({
        event: "request_failed",
        path: url.pathname,
        message: error instanceof Error ? error.message : "unknown",
      }));
      return secure(url.pathname.startsWith("/api/")
        ? json(request, { ok: false, error: "Erro interno." }, 500)
        : new Response("Erro interno.", { status: 500 }));
    }
  },
} satisfies ExportedHandler<Env>;
