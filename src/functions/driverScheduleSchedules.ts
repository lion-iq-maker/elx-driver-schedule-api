import { type DriverScheduleListItem } from "../domain/driverSchedule";
import { driverScheduleLookups } from "./driverScheduleLookups";

const drivers = driverScheduleLookups.drivers;
const trucks = driverScheduleLookups.trucks;
const trailers = driverScheduleLookups.trailers;

export const driverSchedules: DriverScheduleListItem[] = [
  {
    id: "90000000-0000-4000-8000-000000000001",
    driver: drivers[0],
    truck: trucks[0],
    trailer: trailers[0],
    loadPlanNumber: "LP-2024-0001",
    customerName: "ABC Logistics",
    pickupLocation: "Adelaide DC",
    deliveryLocation: "Melbourne Linehaul",
    startDateTimeUtc: "2026-06-18T08:15:00.000Z",
    endDateTimeUtc: "2026-06-19T17:10:00.000Z",
    status: "In Transit",
    conNote: "CN-123456",
    notes: "Linehaul running to plan."
  },
  {
    id: "90000000-0000-4000-8000-000000000002",
    driver: drivers[1],
    truck: trucks[1],
    trailer: trailers[1],
    loadPlanNumber: "LP-2024-0004",
    customerName: "Toll",
    pickupLocation: "Regency Park",
    deliveryLocation: "Port Melbourne",
    startDateTimeUtc: "2026-06-18T09:00:00.000Z",
    endDateTimeUtc: "2026-06-18T18:00:00.000Z",
    status: "Picked Up",
    conNote: "CN-654321",
    notes: "Pickup confirmed."
  },
  {
    id: "90000000-0000-4000-8000-000000000003",
    driver: drivers[2],
    truck: trucks[2],
    trailer: trailers[2],
    loadPlanNumber: "LP-2024-0007",
    customerName: "BHP",
    pickupLocation: "Adelaide DC",
    deliveryLocation: "Sydney DC",
    startDateTimeUtc: "2026-06-19T13:30:00.000Z",
    endDateTimeUtc: "2026-06-21T08:20:00.000Z",
    status: "Scheduled",
    conNote: "CN-789456",
    notes: "Awaiting release."
  },
  {
    id: "90000000-0000-4000-8000-000000000004",
    driver: drivers[3],
    truck: trucks[3],
    trailer: trailers[3],
    loadPlanNumber: "LP-2024-0008",
    customerName: "Linfox",
    pickupLocation: "Gepps Cross",
    deliveryLocation: "Melbourne Depot",
    startDateTimeUtc: "2026-06-17T07:00:00.000Z",
    endDateTimeUtc: "2026-06-18T11:30:00.000Z",
    status: "Delivered",
    conNote: "CN-987654",
    notes: "POD received."
  },
  {
    id: "90000000-0000-4000-8000-000000000005",
    driver: drivers[4],
    truck: trucks[4],
    trailer: trailers[4],
    loadPlanNumber: null,
    customerName: "Fleet",
    pickupLocation: "Adelaide DC",
    deliveryLocation: "Workshop Bay 2",
    startDateTimeUtc: "2026-06-18T06:00:00.000Z",
    endDateTimeUtc: "2026-06-20T16:00:00.000Z",
    status: "Maintenance",
    conNote: null,
    notes: "Scheduled service."
  },
  {
    id: "90000000-0000-4000-8000-000000000006",
    driver: drivers[5],
    truck: null,
    trailer: null,
    loadPlanNumber: null,
    customerName: "Internal",
    pickupLocation: null,
    deliveryLocation: null,
    startDateTimeUtc: "2026-06-18T00:00:00.000Z",
    endDateTimeUtc: "2026-06-22T23:59:00.000Z",
    status: "Annual Leave",
    conNote: null,
    notes: "Annual leave approved."
  },
  {
    id: "90000000-0000-4000-8000-000000000007",
    driver: drivers[6],
    truck: trucks[6],
    trailer: trailers[6],
    loadPlanNumber: "LP-2024-0010",
    customerName: "Visy",
    pickupLocation: "Port Adelaide",
    deliveryLocation: "Perth Depot",
    startDateTimeUtc: "2026-06-18T10:30:00.000Z",
    endDateTimeUtc: "2026-06-23T15:20:00.000Z",
    status: "Delayed",
    conNote: "CN-147852",
    notes: "Mechanical delay under review."
  },
  {
    id: "90000000-0000-4000-8000-000000000008",
    driver: drivers[7],
    truck: trucks[7],
    trailer: trailers[7],
    loadPlanNumber: null,
    customerName: "Internal",
    pickupLocation: null,
    deliveryLocation: null,
    startDateTimeUtc: "2026-06-20T00:00:00.000Z",
    endDateTimeUtc: "2026-06-20T23:59:00.000Z",
    status: "Day Off",
    conNote: null,
    notes: "Rostered day off."
  }
];
