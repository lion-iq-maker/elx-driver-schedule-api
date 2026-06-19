import { app, type HttpRequest, type InvocationContext, type HttpResponseInit } from "@azure/functions";
import { getRequestRoles } from "../shared/auth";
import { jsonResponse, validateCors } from "../shared/http";

export async function driverScheduleAuthDebug(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Driver Schedule auth debug requested");

  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const encodedPrincipal = request.headers.get("x-ms-client-principal");
  const rolesHeader = request.headers.get("x-ms-client-principal-roles");

  return jsonResponse({
    userIdPresent: Boolean(request.headers.get("x-ms-client-principal-id")),
    userName: request.headers.get("x-ms-client-principal-name") ?? null,
    principalHeaderPresent: Boolean(encodedPrincipal),
    rolesHeaderPresent: Boolean(rolesHeader),
    rolesHeaderValue: rolesHeader ?? null,
    rolesDetected: getRequestRoles(request)
  });
}

app.http("driverScheduleAuthDebug", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "driver-schedule/auth-debug",
  handler: driverScheduleAuthDebug
});
