import { randomUUID } from "crypto";
import { app, type HttpRequest, type InvocationContext, type HttpResponseInit } from "@azure/functions";
import { type DriverScheduleCreate, type DriverScheduleListItem, type ScheduleStatus } from "../domain/driverSchedule";
import { auditEvents } from "../data/auditEvents";
import { driverScheduleLookups } from "../data/driverScheduleLookups";
import { driverSchedules } from "../data/driverScheduleSchedules";
import { addAuditEventToSql, createDriverScheduleInSql, findOrCreateDriverInSql, findOrCreateTrailerInSql, findOrCreateTruckInSql, findSchedulePayloadConflictInSql, getDriverScheduleFromSql, listDriverSchedulesFromSql, softDeleteDriverScheduleInSql, updateDriverScheduleInSql, validateScheduleReferencesInSql } from "../data/driverScheduleSqlRepository";
import { isSqlConfigured } from "../data/sqlClient";
import { validateRole } from "../shared/auth";
import { jsonResponse, validateCors } from "../shared/http";
import { isScheduleStatus, utcNow, validateDriverSchedulePayload } from "../shared/validation";

export async function getDriverSchedules(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Driver Schedule list requested", { method: request.method });

  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const roleError = validateRole(request, request.method === "GET" ? ["Admin", "Scheduler", "Viewer"] : ["Admin", "Scheduler"]);
  if (roleError) return roleError;

  if (request.method === "POST") {
    return createDriverSchedule(request, context);
  }

  const start = request.query.get("start");
  const end = request.query.get("end");
  const driverId = request.query.get("driverId");
  const truckId = request.query.get("truckId");
  const status = request.query.get("status");

  if (!start || !end || !isValidDate(start) || !isValidDate(end)) {
    return jsonResponse({ errors: ["start and end query parameters are required valid dates."] }, 400);
  }

  if (new Date(end) <= new Date(start)) {
    return jsonResponse({ errors: ["end must be after start."] }, 400);
  }

  if (status && !isScheduleStatus(status)) {
    return jsonResponse({ errors: ["status must be an allowed Driver Schedule status."] }, 400);
  }

  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  const statusFilter = status ? status as ScheduleStatus : null;
  const source = isSqlConfigured() ? "azure-sql" : "static-mock";
  const items = isSqlConfigured()
    ? await listDriverSchedulesFromSql({ start: rangeStart, end: rangeEnd, driverId, truckId, status: statusFilter })
    : driverSchedules.filter((schedule) => !schedule.isDeleted
      && isInRange(schedule, rangeStart, rangeEnd)
      && (!driverId || schedule.driver.id === driverId)
      && (!truckId || schedule.truck?.id === truckId)
      && (!statusFilter || schedule.status === statusFilter));

  return jsonResponse({
    items,
    meta: {
      source,
      count: items.length,
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
      generatedAtUtc: utcNow()
    }
  });
}

function isInRange(schedule: DriverScheduleListItem, rangeStart: Date, rangeEnd: Date): boolean {
  const scheduleStart = new Date(schedule.startDateTimeUtc);
  const scheduleEnd = new Date(schedule.endDateTimeUtc);
  return scheduleEnd >= rangeStart && scheduleStart < rangeEnd;
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

app.http("driverScheduleSchedules", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "driver-schedule/schedules",
  handler: getDriverSchedules
});

app.http("driverScheduleById", {
  methods: ["PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  route: "driver-schedule/schedules/{id}",
  handler: handleDriverScheduleById
});

async function handleDriverScheduleById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const corsError = validateCors(request);
  if (corsError) return corsError;

  if (request.method === "OPTIONS") {
    return jsonResponse(null, 204);
  }

  const roleError = validateRole(request, ["Admin", "Scheduler"]);
  if (roleError) return roleError;

  if (request.method === "DELETE") {
    return deleteDriverSchedule(request, context);
  }

  return updateDriverSchedule(request, context);
}

async function createDriverSchedule(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Driver Schedule create requested");

  const body = await request.json().catch(() => null);
  const actorUserId = request.headers.get("x-ms-client-principal-id");
  const actorEmail = getActorEmail(request);
  const payload = isSqlConfigured() ? await resolveTypedAssets(body ?? {}, actorEmail) : body ?? {};
  const validation = validateDriverSchedulePayload(payload as Parameters<typeof validateDriverSchedulePayload>[0]);
  if (!validation.ok || !validation.value) {
    return jsonResponse({ errors: validation.errors }, 400);
  }

  if (isSqlConfigured()) {
    const referenceErrors = await validateScheduleReferencesInSql(validation.value);
    if (referenceErrors.length) return jsonResponse({ errors: referenceErrors }, 400);

    const conflict = await findSchedulePayloadConflictInSql(validation.value);
    if (conflict) return jsonResponse({ errors: [conflict] }, 409);

    const schedule = await createDriverScheduleInSql(randomUUID(), validation.value, actorEmail);
    await addAuditEventToSql(createAuditEvent("CREATE", schedule.id, actorUserId, actorEmail, null, schedule));
    return jsonResponse({ item: schedule, auditCount: 1 }, 201);
  }

  const schedule = toScheduleListItem(validation.value);
  if (!schedule.driver) return jsonResponse({ errors: ["driverId does not match an active driver."] }, 400);
  if (validation.value.truckId && !schedule.truck) return jsonResponse({ errors: ["truckId does not match an active truck."] }, 400);
  if (validation.value.trailerId && !schedule.trailer) return jsonResponse({ errors: ["trailerId does not match an active trailer."] }, 400);
  const conflict = findScheduleConflict(schedule);
  if (conflict) return jsonResponse({ errors: [conflict] }, 409);

  driverSchedules.push(schedule);
  auditEvents.push(createAuditEvent("CREATE", schedule.id, request.headers.get("x-ms-client-principal-id"), getActorEmail(request), null, schedule));

  return jsonResponse({ item: schedule, auditCount: auditEvents.length }, 201);
}

function toScheduleListItem(value: DriverScheduleCreate): DriverScheduleListItem {
  return {
    id: randomUUID(),
    driver: driverScheduleLookups.drivers.find((driver) => driver.id === value.driverId)!,
    truck: value.truckId ? driverScheduleLookups.trucks.find((truck) => truck.id === value.truckId) ?? null : null,
    trailer: value.trailerId ? driverScheduleLookups.trailers.find((trailer) => trailer.id === value.trailerId) ?? null : null,
    loadPlanNumber: value.loadPlanNumber,
    customerName: value.customerName,
    pickupLocation: value.pickupLocation,
    deliveryLocation: value.deliveryLocation,
    startDateTimeUtc: value.startDateTimeUtc,
    endDateTimeUtc: value.endDateTimeUtc,
    status: value.status,
    conNote: value.conNote,
    notes: value.notes
  };
}

function findScheduleConflict(candidate: DriverScheduleListItem, ignoreId?: string): string | null {
  const candidateStart = new Date(candidate.startDateTimeUtc);
  const candidateEnd = new Date(candidate.endDateTimeUtc);

  for (const schedule of driverSchedules) {
    if (schedule.isDeleted || schedule.id === ignoreId) continue;
    const overlaps = new Date(schedule.endDateTimeUtc) > candidateStart && new Date(schedule.startDateTimeUtc) < candidateEnd;
    if (!overlaps) continue;

    if (schedule.driver.id === candidate.driver.id) return `Driver ${candidate.driver.displayName} already has an overlapping schedule.`;
    if (candidate.truck && schedule.truck?.id === candidate.truck.id) return `Truck ${candidate.truck.truckNumber} already has an overlapping schedule.`;
    if (candidate.trailer && schedule.trailer?.id === candidate.trailer.id) return `Trailer ${candidate.trailer.trailerNumber} already has an overlapping schedule.`;
  }

  return null;
}

async function updateDriverSchedule(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Driver Schedule update requested", { method: request.method });

  const id = request.params.id;
  if (!id) return jsonResponse({ errors: ["Schedule id is required."] }, 400);

  const body = await request.json().catch(() => null);
  const actorUserId = request.headers.get("x-ms-client-principal-id");
  const actorEmail = getActorEmail(request);
  const payload = isSqlConfigured() ? await resolveTypedAssets(body ?? {}, actorEmail) : body ?? {};
  const validation = validateDriverSchedulePayload(payload as Parameters<typeof validateDriverSchedulePayload>[0]);
  if (!validation.ok || !validation.value) {
    return jsonResponse({ errors: validation.errors }, 400);
  }

  if (isSqlConfigured()) {
    const before = await getDriverScheduleFromSql(id);
    if (!before) return jsonResponse({ errors: ["Schedule not found."] }, 404);

    const referenceErrors = await validateScheduleReferencesInSql(validation.value);
    if (referenceErrors.length) return jsonResponse({ errors: referenceErrors }, 400);

    const conflict = await findSchedulePayloadConflictInSql(validation.value, id);
    if (conflict) return jsonResponse({ errors: [conflict] }, 409);

    const updated = await updateDriverScheduleInSql(id, validation.value, actorEmail);
    if (!updated) return jsonResponse({ errors: ["Schedule not found."] }, 404);

    await addAuditEventToSql(createAuditEvent("UPDATE", id, actorUserId, actorEmail, before, updated));
    return jsonResponse({ item: updated, auditCount: 1 });
  }

  const index = driverSchedules.findIndex((schedule) => schedule.id === id);
  if (index < 0) return jsonResponse({ errors: ["Schedule not found."] }, 404);

  const before = driverSchedules[index];
  const updated = { ...toScheduleListItem(validation.value), id };
  if (!updated.driver) return jsonResponse({ errors: ["driverId does not match an active driver."] }, 400);
  if (validation.value.truckId && !updated.truck) return jsonResponse({ errors: ["truckId does not match an active truck."] }, 400);
  if (validation.value.trailerId && !updated.trailer) return jsonResponse({ errors: ["trailerId does not match an active trailer."] }, 400);
  const conflict = findScheduleConflict(updated, id);
  if (conflict) return jsonResponse({ errors: [conflict] }, 409);

  driverSchedules[index] = updated;
  auditEvents.push(createAuditEvent("UPDATE", id, request.headers.get("x-ms-client-principal-id"), getActorEmail(request), before, updated));

  return jsonResponse({ item: updated, auditCount: auditEvents.length });
}

async function resolveTypedAssets(payload: unknown, actorEmail: string): Promise<unknown> {
  if (!payload || typeof payload !== "object") return payload;
  const draft = { ...(payload as Record<string, unknown>) };
  const driverName = typeof draft.driverName === "string" ? draft.driverName.trim() : "";
  const truckNumber = typeof draft.truckNumber === "string" ? draft.truckNumber.trim() : "";
  const trailerNumber = typeof draft.trailerNumber === "string" ? draft.trailerNumber.trim() : "";

  if (driverName && typeof draft.driverId !== "string") {
    const driver = await findOrCreateDriverInSql(driverName, actorEmail);
    draft.driverId = driver.id;
  }

  if (truckNumber && typeof draft.truckId !== "string") {
    const truck = await findOrCreateTruckInSql(truckNumber, actorEmail);
    draft.truckId = truck.id;
  }

  if (trailerNumber && typeof draft.trailerId !== "string") {
    const trailer = await findOrCreateTrailerInSql(trailerNumber, actorEmail);
    draft.trailerId = trailer.id;
  }

  return draft;
}

async function deleteDriverSchedule(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Driver Schedule delete requested", { method: request.method });

  const id = request.params.id;
  if (!id) return jsonResponse({ errors: ["Schedule id is required."] }, 400);

  if (isSqlConfigured()) {
    const before = await getDriverScheduleFromSql(id);
    if (!before) return jsonResponse({ errors: ["Schedule not found."] }, 404);

    const actorUserId = request.headers.get("x-ms-client-principal-id");
    const actorEmail = getActorEmail(request);
    const deleted = await softDeleteDriverScheduleInSql(id, actorEmail);
    if (!deleted) return jsonResponse({ errors: ["Schedule not found."] }, 404);

    await addAuditEventToSql(createAuditEvent("DELETE", id, actorUserId, actorEmail, before, { ...before, isDeleted: true }));
    return jsonResponse({ id, deleted: true, auditCount: 1 });
  }

  const index = driverSchedules.findIndex((schedule) => schedule.id === id && !schedule.isDeleted);
  if (index < 0) return jsonResponse({ errors: ["Schedule not found."] }, 404);

  const before = driverSchedules[index];
  const after = { ...before, isDeleted: true };
  driverSchedules[index] = after;
  auditEvents.push(createAuditEvent("DELETE", id, request.headers.get("x-ms-client-principal-id"), getActorEmail(request), before, after));

  return jsonResponse({ id, deleted: true, auditCount: auditEvents.length });
}

function getActorEmail(request: HttpRequest): string {
  return request.headers.get("x-ms-client-principal-name") ?? "local-dev@elxlogistics.com";
}

function createAuditEvent(
  action: "CREATE" | "UPDATE" | "DELETE",
  entityId: string,
  actorUserId: string | null,
  actorEmail: string,
  before: unknown | null,
  after: unknown | null
) {
  return {
    id: randomUUID(),
    entityType: "driver_schedule",
    entityId,
    action,
    actorUserId,
    actorEmail,
    before,
    after,
    createdAtUtc: utcNow()
  } as const;
}
