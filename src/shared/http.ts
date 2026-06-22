import type { HttpRequest, HttpResponseInit } from "@azure/functions";
import { getConfig } from "./config";

const allowedMethods = "GET, POST, PUT, DELETE, OPTIONS";
const allowedHeaders = "authorization, content-type, x-ms-client-principal-id, x-ms-client-principal-name";

export function jsonResponse(body: unknown, status = 200): HttpResponseInit {
  const config = getConfig();

  return {
    status,
    jsonBody: body,
    headers: {
      "Access-Control-Allow-Origin": config.allowedOrigin,
      "Access-Control-Allow-Methods": allowedMethods,
      "Access-Control-Allow-Headers": allowedHeaders,
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin",
      "Cache-Control": "no-store"
    }
  };
}

export function validateCors(request: HttpRequest): HttpResponseInit | null {
  const origin = request.headers.get("origin");
  const allowedOrigin = getConfig().allowedOrigin;

  if (!origin || origin === allowedOrigin) {
    return null;
  }

  return jsonResponse({ errors: ["Origin is not allowed."] }, 403);
}
