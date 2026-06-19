import { app, type HttpRequest, type InvocationContext, type HttpResponseInit } from "@azure/functions";
import { getConfig, getSafeEnvironmentStatus } from "../shared/config";
import { jsonResponse, validateCors } from "../shared/http";
import { utcNow } from "../shared/validation";

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Health check requested", { method: request.method });

  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const config = getConfig();

  return jsonResponse({
    status: "ok",
    service: config.serviceName,
    environment: getSafeEnvironmentStatus(),
    timeUtc: utcNow()
  });
}

app.http("health", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "health",
  handler: health
});
