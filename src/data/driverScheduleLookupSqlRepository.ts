import { scheduleStatuses, type DriverLookup, type DriverScheduleLookups, type TrailerLookup, type TruckLookup } from "../domain/driverSchedule";
import { getSqlPool } from "./sqlClient";

interface DriverRow {
  id: string;
  display_name: string;
  email: string | null;
  status: string;
}

interface TruckRow {
  id: string;
  truck_number: string;
  status: string;
  current_location: string | null;
}

interface TrailerRow {
  id: string;
  trailer_number: string;
  trailer_type: string | null;
  status: string;
}

export async function getDriverScheduleLookupsFromSql(): Promise<DriverScheduleLookups> {
  const pool = await getSqlPool();
  const [drivers, trucks, trailers] = await Promise.all([
    pool.request().query<DriverRow>(`
      SELECT id, display_name, email, status
      FROM dbo.drivers
      WHERE is_deleted = 0
      ORDER BY display_name ASC;
    `),
    pool.request().query<TruckRow>(`
      SELECT id, truck_number, status, current_location
      FROM dbo.trucks
      WHERE is_deleted = 0
      ORDER BY truck_number ASC;
    `),
    pool.request().query<TrailerRow>(`
      SELECT id, trailer_number, trailer_type, status
      FROM dbo.trailers
      WHERE is_deleted = 0
      ORDER BY trailer_number ASC;
    `)
  ]);

  return {
    drivers: drivers.recordset.map(mapDriver),
    trucks: trucks.recordset.map(mapTruck),
    trailers: trailers.recordset.map(mapTrailer),
    statuses: scheduleStatuses
  };
}

function mapDriver(row: DriverRow): DriverLookup {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    status: row.status
  };
}

function mapTruck(row: TruckRow): TruckLookup {
  return {
    id: row.id,
    truckNumber: row.truck_number,
    status: row.status,
    currentLocation: row.current_location
  };
}

function mapTrailer(row: TrailerRow): TrailerLookup {
  return {
    id: row.id,
    trailerNumber: row.trailer_number,
    trailerType: row.trailer_type,
    status: row.status
  };
}
