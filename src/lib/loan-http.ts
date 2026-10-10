import { dispatch } from "../../library-api/src/dispatch.js";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: CORS });
}

export async function handleLoanHttp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(request.url);
  let body: unknown;
  if (!["GET", "HEAD", "DELETE"].includes(request.method)) {
    const text = await request.text();
    if (text.trim()) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        return json({ success: false, message: "Body JSON tidak valid." }, 400);
      }
    }
  }

  const result = await dispatch({
    method: request.method,
    pathname: url.pathname,
    searchParams: url.searchParams,
    body,
  });

  return json(result.body, result.status);
}
