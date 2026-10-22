import {
  app,
  type HttpRequest,
  type InvocationContext,
  type HttpResponseInit
} from "@azure/functions";

import { fetchTn360VehicleLocations } from "../integrations/tn360Client";
import { validateRole } from "../shared/auth";
import { jsonResponse, validateCors } from "../shared/http";
import { utcNow } from "../shared/validation";

export async function getDriverScheduleLocations(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Driver Schedule TN360 locations requested", {
    method: request.method
  });

  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const roleError = validateRole(request, [
    "Admin",
    "Scheduler",
    "Viewer"
  ]);

  if (roleError) return roleError;

  try {
    const locations = await fetchTn360VehicleLocations();

    return jsonResponse({
      items: locations,
      meta: {
        source: "tn360",
        generatedAtUtc: utcNow()
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown TN360 error";

    context.error(
      "Driver Schedule TN360 locations failed",
      error
    );

    return jsonResponse(
      {
        errors: [
          "TN360 vehicle locations could not be loaded."
        ],
        diagnostic: {
          source: "tn360",
          message
        }
      },
      502
    );
  }
}

app.http("driverScheduleLocations", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "driver-schedule/locations",
  handler: getDriverScheduleLocations
});