import {
  type DriverScheduleCreate,
  type DriverSchedulePayload,
  type ScheduleStatus,
  type ValidationResult,
  freightMovementStatuses,
  nonMovementStatuses,
  scheduleStatuses
} from "../domain/driverSchedule";

export function utcNow(): string {
  return new Date().toISOString();
}

export function validateDriverSchedulePayload(payload: DriverSchedulePayload): ValidationResult<DriverScheduleCreate> {
  const errors: string[] = [];
  const status = payload.status as ScheduleStatus | undefined;

  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  if (!isGuid(payload.driverId)) errors.push("driverId is required and must be a GUID.");
  if (!payload.startDateTimeUtc || !isValidDate(payload.startDateTimeUtc)) errors.push("startDateTimeUtc is required and must be a valid date/time.");
  if (!payload.endDateTimeUtc || !isValidDate(payload.endDateTimeUtc)) errors.push("endDateTimeUtc is required and must be a valid date/time.");
  if (payload.startDateTimeUtc && payload.endDateTimeUtc && isValidDate(payload.startDateTimeUtc) && isValidDate(payload.endDateTimeUtc) && new Date(payload.endDateTimeUtc) <= new Date(payload.startDateTimeUtc)) {
    errors.push("endDateTimeUtc must be after startDateTimeUtc.");
  }
  if (!status || !isScheduleStatus(status)) errors.push("status is required and must be an allowed Driver Schedule status.");

  const isMovement = Boolean(status && freightMovementStatuses.includes(status));
  const isNonMovement = Boolean(status && nonMovementStatuses.includes(status));

  if (isMovement) {
    if (!isGuid(payload.truckId)) errors.push("truckId is required for freight movement schedules.");
    if (!isGuid(payload.trailerId)) errors.push("trailerId is required for freight movement schedules.");
    if (!hasText(payload.loadPlanNumber)) errors.push("loadPlanNumber is required for freight movement schedules.");
    if (!hasText(payload.customerName)) errors.push("customerName is required for freight movement schedules.");
    if (!hasText(payload.pickupLocation)) errors.push("pickupLocation is required for freight movement schedules.");
    if (!hasText(payload.deliveryLocation)) errors.push("deliveryLocation is required for freight movement schedules.");
  }

  if (isNonMovement && status === "Maintenance" && !isGuid(payload.truckId) && !isGuid(payload.trailerId)) {
    errors.push("Maintenance schedules require a truckId or trailerId.");
  }

  validateMaxLength("loadPlanNumber", payload.loadPlanNumber, 80, errors);
  validateMaxLength("customerName", payload.customerName, 150, errors);
  validateMaxLength("pickupLocation", payload.pickupLocation, 200, errors);
  validateMaxLength("deliveryLocation", payload.deliveryLocation, 200, errors);
  validateMaxLength("conNote", payload.conNote, 80, errors);
  validateMaxLength("notes", payload.notes, 2000, errors);

  if (errors.length > 0 || !payload.driverId || !payload.startDateTimeUtc || !payload.endDateTimeUtc || !status) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    value: {
      driverId: payload.driverId,
      truckId: payload.truckId ?? null,
      trailerId: payload.trailerId ?? null,
      loadPlanNumber: normalizeOptionalText(payload.loadPlanNumber),
      customerName: normalizeOptionalText(payload.customerName),
      pickupLocation: normalizeOptionalText(payload.pickupLocation),
      deliveryLocation: normalizeOptionalText(payload.deliveryLocation),
      startDateTimeUtc: new Date(payload.startDateTimeUtc).toISOString(),
      endDateTimeUtc: new Date(payload.endDateTimeUtc).toISOString(),
      status,
      conNote: normalizeOptionalText(payload.conNote),
      notes: normalizeOptionalText(payload.notes)
    }
  };
}

export function isScheduleStatus(value: string): value is ScheduleStatus {
  return scheduleStatuses.includes(value as ScheduleStatus);
}

function isGuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) return null;
  return value.trim();
}

function validateMaxLength(field: string, value: string | null | undefined, max: number, errors: string[]): void {
  if (value && value.length > max) errors.push(`${field} must be ${max} characters or fewer.`);
}
