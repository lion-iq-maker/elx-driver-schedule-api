export const scheduleStatuses = [
  "Scheduled",
  "Picked Up",
  "In Transit",
  "At Depot",
  "Delivered",
  "Annual Leave",
  "Sick Leave",
  "Day Off",
  "Maintenance",
  "Delayed"
] as const;

export type ScheduleStatus = (typeof scheduleStatuses)[number];

export const freightMovementStatuses: ScheduleStatus[] = [
  "Scheduled",
  "Picked Up",
  "In Transit",
  "At Depot",
  "Delivered",
  "Delayed"
];

export const nonMovementStatuses: ScheduleStatus[] = [
  "Annual Leave",
  "Sick Leave",
  "Day Off",
  "Maintenance"
];

export interface DriverSchedulePayload {
  driverId?: string;
  truckId?: string | null;
  trailerId?: string | null;
  loadPlanNumber?: string | null;
  customerName?: string | null;
  pickupLocation?: string | null;
  deliveryLocation?: string | null;
  startDateTimeUtc?: string;
  endDateTimeUtc?: string;
  status?: string;
  conNote?: string | null;
  notes?: string | null;
}

export interface DriverScheduleCreate {
  driverId: string;
  truckId: string | null;
  trailerId: string | null;
  loadPlanNumber: string | null;
  customerName: string | null;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: ScheduleStatus;
  conNote: string | null;
  notes: string | null;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}

export interface DriverLookup {
  id: string;
  displayName: string;
  email: string | null;
  status: string;
}

export interface TruckLookup {
  id: string;
  truckNumber: string;
  status: string;
  currentLocation: string | null;
}

export interface TrailerLookup {
  id: string;
  trailerNumber: string;
  trailerType: string | null;
  status: string;
}

export interface DriverScheduleLookups {
  drivers: DriverLookup[];
  trucks: TruckLookup[];
  trailers: TrailerLookup[];
  statuses: readonly ScheduleStatus[];
}

export interface DriverScheduleListItem {
  id: string;
  driver: DriverLookup;
  truck: TruckLookup | null;
  trailer: TrailerLookup | null;
  loadPlanNumber: string | null;
  customerName: string | null;
  pickupLocation: string | null;
  deliveryLocation: string | null;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: ScheduleStatus;
  conNote: string | null;
  notes: string | null;
  isDeleted?: boolean;
}

export interface AuditEvent {
  id: string;
  entityType: "driver_schedule";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "ASSIGNMENT_CHANGE" | "DATE_CHANGE";
  actorUserId: string | null;
  actorEmail: string;
  before: unknown | null;
  after: unknown | null;
  createdAtUtc: string;
}
