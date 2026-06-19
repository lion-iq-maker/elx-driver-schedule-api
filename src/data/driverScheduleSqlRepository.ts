import { type AuditEvent, type DriverLookup, type DriverScheduleCreate, type DriverScheduleListItem, type ScheduleStatus, type TrailerLookup, type TruckLookup } from "../domain/driverSchedule";
import { getSqlPool, sql } from "./sqlClient";

interface ScheduleRow {
  id: string;
  driver_id: string;
  driver_display_name: string;
  driver_email: string | null;
  driver_status: string;
  truck_id: string | null;
  truck_number: string | null;
  truck_status: string | null;
  truck_current_location: string | null;
  trailer_id: string | null;
  trailer_number: string | null;
  trailer_type: string | null;
  trailer_status: string | null;
  load_plan_number: string | null;
  customer_name: string | null;
  pickup_location: string | null;
  delivery_location: string | null;
  start_datetime_utc: Date;
  end_datetime_utc: Date;
  status: ScheduleStatus;
  con_note: string | null;
  notes: string | null;
}

export interface ScheduleQuery {
  start: Date;
  end: Date;
  driverId?: string | null;
  truckId?: string | null;
  status?: ScheduleStatus | null;
}

export async function listDriverSchedulesFromSql(query: ScheduleQuery): Promise<DriverScheduleListItem[]> {
  const pool = await getSqlPool();
  const request = pool.request()
    .input("start", sql.DateTime2, query.start)
    .input("end", sql.DateTime2, query.end)
    .input("driverId", sql.UniqueIdentifier, query.driverId ?? null)
    .input("truckId", sql.UniqueIdentifier, query.truckId ?? null)
    .input("status", sql.NVarChar(40), query.status ?? null);

  const result = await request.query<ScheduleRow>(`
    SELECT
      schedules.id,
      schedules.driver_id,
      drivers.display_name AS driver_display_name,
      drivers.email AS driver_email,
      drivers.status AS driver_status,
      schedules.truck_id,
      trucks.truck_number,
      trucks.status AS truck_status,
      trucks.current_location AS truck_current_location,
      schedules.trailer_id,
      trailers.trailer_number,
      trailers.trailer_type,
      trailers.status AS trailer_status,
      schedules.load_plan_number,
      schedules.customer_name,
      schedules.pickup_location,
      schedules.delivery_location,
      schedules.start_datetime_utc,
      schedules.end_datetime_utc,
      schedules.status,
      schedules.con_note,
      schedules.notes
    FROM dbo.driver_schedules schedules
    INNER JOIN dbo.drivers drivers ON drivers.id = schedules.driver_id AND drivers.is_deleted = 0
    LEFT JOIN dbo.trucks trucks ON trucks.id = schedules.truck_id AND trucks.is_deleted = 0
    LEFT JOIN dbo.trailers trailers ON trailers.id = schedules.trailer_id AND trailers.is_deleted = 0
    WHERE schedules.is_deleted = 0
      AND schedules.end_datetime_utc >= @start
      AND schedules.start_datetime_utc < @end
      AND (@driverId IS NULL OR schedules.driver_id = @driverId)
      AND (@truckId IS NULL OR schedules.truck_id = @truckId)
      AND (@status IS NULL OR schedules.status = @status)
    ORDER BY schedules.start_datetime_utc ASC;
  `);

  return result.recordset.map(mapScheduleRow);
}

export async function getDriverScheduleFromSql(id: string): Promise<DriverScheduleListItem | null> {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .query<ScheduleRow>(`${selectScheduleSql} WHERE schedules.id = @id AND schedules.is_deleted = 0;`);

  return result.recordset[0] ? mapScheduleRow(result.recordset[0]) : null;
}

export async function createDriverScheduleInSql(id: string, value: DriverScheduleCreate, actorEmail: string): Promise<DriverScheduleListItem> {
  const pool = await getSqlPool();
  await pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .input("driverId", sql.UniqueIdentifier, value.driverId)
    .input("truckId", sql.UniqueIdentifier, value.truckId)
    .input("trailerId", sql.UniqueIdentifier, value.trailerId)
    .input("loadPlanNumber", sql.NVarChar(80), value.loadPlanNumber)
    .input("customerName", sql.NVarChar(150), value.customerName)
    .input("pickupLocation", sql.NVarChar(200), value.pickupLocation)
    .input("deliveryLocation", sql.NVarChar(200), value.deliveryLocation)
    .input("startDateTimeUtc", sql.DateTime2, new Date(value.startDateTimeUtc))
    .input("endDateTimeUtc", sql.DateTime2, new Date(value.endDateTimeUtc))
    .input("status", sql.NVarChar(40), value.status)
    .input("conNote", sql.NVarChar(80), value.conNote)
    .input("notes", sql.NVarChar(2000), value.notes)
    .input("actorEmail", sql.NVarChar(255), actorEmail)
    .query(`
      INSERT INTO dbo.driver_schedules (
        id, driver_id, truck_id, trailer_id, load_plan_number, customer_name,
        pickup_location, delivery_location, start_datetime_utc, end_datetime_utc,
        status, con_note, notes, created_by, updated_by
      )
      VALUES (
        @id, @driverId, @truckId, @trailerId, @loadPlanNumber, @customerName,
        @pickupLocation, @deliveryLocation, @startDateTimeUtc, @endDateTimeUtc,
        @status, @conNote, @notes, @actorEmail, @actorEmail
      );
    `);

  const created = await getDriverScheduleFromSql(id);
  if (!created) throw new Error("Created schedule could not be loaded.");
  return created;
}

export async function updateDriverScheduleInSql(id: string, value: DriverScheduleCreate, actorEmail: string): Promise<DriverScheduleListItem | null> {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .input("driverId", sql.UniqueIdentifier, value.driverId)
    .input("truckId", sql.UniqueIdentifier, value.truckId)
    .input("trailerId", sql.UniqueIdentifier, value.trailerId)
    .input("loadPlanNumber", sql.NVarChar(80), value.loadPlanNumber)
    .input("customerName", sql.NVarChar(150), value.customerName)
    .input("pickupLocation", sql.NVarChar(200), value.pickupLocation)
    .input("deliveryLocation", sql.NVarChar(200), value.deliveryLocation)
    .input("startDateTimeUtc", sql.DateTime2, new Date(value.startDateTimeUtc))
    .input("endDateTimeUtc", sql.DateTime2, new Date(value.endDateTimeUtc))
    .input("status", sql.NVarChar(40), value.status)
    .input("conNote", sql.NVarChar(80), value.conNote)
    .input("notes", sql.NVarChar(2000), value.notes)
    .input("actorEmail", sql.NVarChar(255), actorEmail)
    .query(`
      UPDATE dbo.driver_schedules
      SET driver_id = @driverId,
          truck_id = @truckId,
          trailer_id = @trailerId,
          load_plan_number = @loadPlanNumber,
          customer_name = @customerName,
          pickup_location = @pickupLocation,
          delivery_location = @deliveryLocation,
          start_datetime_utc = @startDateTimeUtc,
          end_datetime_utc = @endDateTimeUtc,
          status = @status,
          con_note = @conNote,
          notes = @notes,
          updated_by = @actorEmail,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id AND is_deleted = 0;
    `);

  if (result.rowsAffected[0] === 0) return null;
  return getDriverScheduleFromSql(id);
}

export async function softDeleteDriverScheduleInSql(id: string, actorEmail: string): Promise<boolean> {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("id", sql.UniqueIdentifier, id)
    .input("actorEmail", sql.NVarChar(255), actorEmail)
    .query(`
      UPDATE dbo.driver_schedules
      SET is_deleted = 1,
          updated_by = @actorEmail,
          updated_at = SYSUTCDATETIME()
      WHERE id = @id AND is_deleted = 0;
    `);

  return result.rowsAffected[0] > 0;
}

export async function findScheduleConflictInSql(candidate: DriverScheduleListItem, ignoreId?: string): Promise<string | null> {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("id", sql.UniqueIdentifier, ignoreId ?? null)
    .input("driverId", sql.UniqueIdentifier, candidate.driver.id)
    .input("truckId", sql.UniqueIdentifier, candidate.truck?.id ?? null)
    .input("trailerId", sql.UniqueIdentifier, candidate.trailer?.id ?? null)
    .input("startDateTimeUtc", sql.DateTime2, new Date(candidate.startDateTimeUtc))
    .input("endDateTimeUtc", sql.DateTime2, new Date(candidate.endDateTimeUtc))
    .query<{ conflict_type: "driver" | "truck" | "trailer"; conflict_label: string }>(`
      SELECT TOP 1
        CASE
          WHEN driver_id = @driverId THEN N'driver'
          WHEN @truckId IS NOT NULL AND truck_id = @truckId THEN N'truck'
          ELSE N'trailer'
        END AS conflict_type,
        CASE
          WHEN driver_id = @driverId THEN @driverId
          WHEN @truckId IS NOT NULL AND truck_id = @truckId THEN @truckId
          ELSE @trailerId
        END AS conflict_label
      FROM dbo.driver_schedules
      WHERE is_deleted = 0
        AND (@id IS NULL OR id <> @id)
        AND end_datetime_utc > @startDateTimeUtc
        AND start_datetime_utc < @endDateTimeUtc
        AND (
          driver_id = @driverId
          OR (@truckId IS NOT NULL AND truck_id = @truckId)
          OR (@trailerId IS NOT NULL AND trailer_id = @trailerId)
        );
    `);

  const conflict = result.recordset[0];
  if (!conflict) return null;
  if (conflict.conflict_type === "driver") return `Driver ${candidate.driver.displayName} already has an overlapping schedule.`;
  if (conflict.conflict_type === "truck" && candidate.truck) return `Truck ${candidate.truck.truckNumber} already has an overlapping schedule.`;
  if (conflict.conflict_type === "trailer" && candidate.trailer) return `Trailer ${candidate.trailer.trailerNumber} already has an overlapping schedule.`;
  return "Schedule overlaps with an existing assignment.";
}

export async function findSchedulePayloadConflictInSql(value: DriverScheduleCreate, ignoreId?: string): Promise<string | null> {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("id", sql.UniqueIdentifier, ignoreId ?? null)
    .input("driverId", sql.UniqueIdentifier, value.driverId)
    .input("truckId", sql.UniqueIdentifier, value.truckId)
    .input("trailerId", sql.UniqueIdentifier, value.trailerId)
    .input("startDateTimeUtc", sql.DateTime2, new Date(value.startDateTimeUtc))
    .input("endDateTimeUtc", sql.DateTime2, new Date(value.endDateTimeUtc))
    .query<{ conflict_type: "driver" | "truck" | "trailer" }>(`
      SELECT TOP 1
        CASE
          WHEN driver_id = @driverId THEN N'driver'
          WHEN @truckId IS NOT NULL AND truck_id = @truckId THEN N'truck'
          ELSE N'trailer'
        END AS conflict_type
      FROM dbo.driver_schedules
      WHERE is_deleted = 0
        AND (@id IS NULL OR id <> @id)
        AND end_datetime_utc > @startDateTimeUtc
        AND start_datetime_utc < @endDateTimeUtc
        AND (
          driver_id = @driverId
          OR (@truckId IS NOT NULL AND truck_id = @truckId)
          OR (@trailerId IS NOT NULL AND trailer_id = @trailerId)
        );
    `);

  const conflictType = result.recordset[0]?.conflict_type;
  if (!conflictType) return null;
  return `${conflictType[0].toUpperCase()}${conflictType.slice(1)} already has an overlapping schedule.`;
}

export async function validateScheduleReferencesInSql(value: DriverScheduleCreate): Promise<string[]> {
  const pool = await getSqlPool();
  const request = pool.request()
    .input("driverId", sql.UniqueIdentifier, value.driverId)
    .input("truckId", sql.UniqueIdentifier, value.truckId)
    .input("trailerId", sql.UniqueIdentifier, value.trailerId);

  const result = await request.query<{ driver_exists: number; truck_exists: number; trailer_exists: number }>(`
    SELECT
      CASE WHEN EXISTS (SELECT 1 FROM dbo.drivers WHERE id = @driverId AND is_deleted = 0) THEN 1 ELSE 0 END AS driver_exists,
      CASE WHEN @truckId IS NULL OR EXISTS (SELECT 1 FROM dbo.trucks WHERE id = @truckId AND is_deleted = 0) THEN 1 ELSE 0 END AS truck_exists,
      CASE WHEN @trailerId IS NULL OR EXISTS (SELECT 1 FROM dbo.trailers WHERE id = @trailerId AND is_deleted = 0) THEN 1 ELSE 0 END AS trailer_exists;
  `);

  const row = result.recordset[0];
  const errors: string[] = [];
  if (!row?.driver_exists) errors.push("driverId does not match an active driver.");
  if (!row?.truck_exists) errors.push("truckId does not match an active truck.");
  if (!row?.trailer_exists) errors.push("trailerId does not match an active trailer.");
  return errors;
}

export async function addAuditEventToSql(event: AuditEvent): Promise<void> {
  const pool = await getSqlPool();
  await pool.request()
    .input("id", sql.UniqueIdentifier, event.id)
    .input("entityType", sql.NVarChar(80), event.entityType)
    .input("entityId", sql.UniqueIdentifier, event.entityId)
    .input("action", sql.NVarChar(40), event.action)
    .input("actorUserId", sql.NVarChar(255), event.actorUserId)
    .input("actorEmail", sql.NVarChar(255), event.actorEmail)
    .input("beforeJson", sql.NVarChar(sql.MAX), event.before ? JSON.stringify(event.before) : null)
    .input("afterJson", sql.NVarChar(sql.MAX), event.after ? JSON.stringify(event.after) : null)
    .query(`
      INSERT INTO dbo.audit_events (
        id, entity_type, entity_id, action, actor_user_id, actor_email, before_json, after_json
      )
      VALUES (
        @id, @entityType, @entityId, @action, @actorUserId, @actorEmail, @beforeJson, @afterJson
      );
    `);
}

interface AuditEventRow {
  id: string;
  entity_type: "driver_schedule";
  entity_id: string;
  action: AuditEvent["action"];
  actor_user_id: string | null;
  actor_email: string;
  before_json: string | null;
  after_json: string | null;
  created_at: Date;
}

export async function listAuditEventsFromSql(entityId: string): Promise<AuditEvent[]> {
  const pool = await getSqlPool();
  const result = await pool.request()
    .input("entityId", sql.UniqueIdentifier, entityId)
    .query<AuditEventRow>(`
      SELECT
        id,
        entity_type,
        entity_id,
        action,
        actor_user_id,
        actor_email,
        before_json,
        after_json,
        created_at
      FROM dbo.audit_events
      WHERE entity_type = N'driver_schedule'
        AND entity_id = @entityId
      ORDER BY created_at DESC;
    `);

  return result.recordset.map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    before: row.before_json ? JSON.parse(row.before_json) : null,
    after: row.after_json ? JSON.parse(row.after_json) : null,
    createdAtUtc: row.created_at.toISOString()
  }));
}

const selectScheduleSql = `
  SELECT
    schedules.id,
    schedules.driver_id,
    drivers.display_name AS driver_display_name,
    drivers.email AS driver_email,
    drivers.status AS driver_status,
    schedules.truck_id,
    trucks.truck_number,
    trucks.status AS truck_status,
    trucks.current_location AS truck_current_location,
    schedules.trailer_id,
    trailers.trailer_number,
    trailers.trailer_type,
    trailers.status AS trailer_status,
    schedules.load_plan_number,
    schedules.customer_name,
    schedules.pickup_location,
    schedules.delivery_location,
    schedules.start_datetime_utc,
    schedules.end_datetime_utc,
    schedules.status,
    schedules.con_note,
    schedules.notes
  FROM dbo.driver_schedules schedules
  INNER JOIN dbo.drivers drivers ON drivers.id = schedules.driver_id AND drivers.is_deleted = 0
  LEFT JOIN dbo.trucks trucks ON trucks.id = schedules.truck_id AND trucks.is_deleted = 0
  LEFT JOIN dbo.trailers trailers ON trailers.id = schedules.trailer_id AND trailers.is_deleted = 0
`;

function mapScheduleRow(row: ScheduleRow): DriverScheduleListItem {
  const driver: DriverLookup = {
    id: row.driver_id,
    displayName: row.driver_display_name,
    email: row.driver_email,
    status: row.driver_status
  };

  const truck: TruckLookup | null = row.truck_id && row.truck_number
    ? {
        id: row.truck_id,
        truckNumber: row.truck_number,
        status: row.truck_status ?? "Available",
        currentLocation: row.truck_current_location
      }
    : null;

  const trailer: TrailerLookup | null = row.trailer_id && row.trailer_number
    ? {
        id: row.trailer_id,
        trailerNumber: row.trailer_number,
        trailerType: row.trailer_type,
        status: row.trailer_status ?? "Available"
      }
    : null;

  return {
    id: row.id,
    driver,
    truck,
    trailer,
    loadPlanNumber: row.load_plan_number,
    customerName: row.customer_name,
    pickupLocation: row.pickup_location,
    deliveryLocation: row.delivery_location,
    startDateTimeUtc: row.start_datetime_utc.toISOString(),
    endDateTimeUtc: row.end_datetime_utc.toISOString(),
    status: row.status,
    conNote: row.con_note,
    notes: row.notes
  };
}
