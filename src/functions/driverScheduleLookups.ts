import { app, type HttpRequest, type InvocationContext, type HttpResponseInit } from "@azure/functions";
import { driverScheduleLookups } from "../data/driverScheduleLookups";
import { getDriverScheduleLookupsFromSql } from "../data/driverScheduleLookupSqlRepository";
import { isSqlConfigured } from "../data/sqlClient";
import { validateRole } from "../shared/auth";
import { jsonResponse, validateCors } from "../shared/http";
import { utcNow } from "../shared/validation";

export async function getDriverScheduleLookups(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Driver Schedule lookups requested", { method: request.method });

  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const roleError = validateRole(request, ["Admin", "Scheduler", "Viewer"]);
  if (roleError) return roleError;

  const source = isSqlConfigured() ? "azure-sql" : "static-mock";
  const data = isSqlConfigured() ? await getDriverScheduleLookupsFromSql() : driverScheduleLookups;

  return jsonResponse({
    data,
    meta: {
      source,
      generatedAtUtc: utcNow()
    }
  });
}

app.http("driverScheduleLookups", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "driver-schedule/lookups",
  handler: getDriverScheduleLookups
});
