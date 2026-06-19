import { app, type HttpRequest, type InvocationContext, type HttpResponseInit } from "@azure/functions";
import { auditEvents } from "../data/auditEvents";
import { listAuditEventsFromSql } from "../data/driverScheduleSqlRepository";
import { isSqlConfigured } from "../data/sqlClient";
import { validateRole } from "../shared/auth";
import { jsonResponse, validateCors } from "../shared/http";
import { utcNow } from "../shared/validation";

export async function getDriverScheduleAudit(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Driver Schedule audit requested", { method: request.method });

  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const roleError = validateRole(request, ["Admin", "Scheduler"]);
  if (roleError) return roleError;

  const entityId = request.query.get("entityId");
  if (!entityId) {
    return jsonResponse({ errors: ["entityId query parameter is required."] }, 400);
  }

  const source = isSqlConfigured() ? "azure-sql" : "static-mock";
  const items = isSqlConfigured()
    ? await listAuditEventsFromSql(entityId)
    : auditEvents.filter((event) => event.entityType === "driver_schedule" && event.entityId === entityId);

  return jsonResponse({
    items,
    meta: {
      source,
      count: items.length,
      generatedAtUtc: utcNow()
    }
  });
}

app.http("driverScheduleAudit", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "driver-schedule/audit",
  handler: getDriverScheduleAudit
});
