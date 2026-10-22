import { getConfig } from "../shared/config";

export interface Tn360VehicleLocation {
  vehicleId: number;
  vehicleName: string;
  registration: string;
  location: string | null;
  updatedAt: string | null;
}

interface Tn360VehicleStatsResponse {
  location?: string | null;
  updatedAt?: string | null;
  vehicle?: {
    id?: number;
    name?: string;
    registration?: string;
  };
}

export async function fetchTn360VehicleLocations(): Promise<Tn360VehicleLocation[]> {
  const config = getConfig();

  if (!config.tn360ApiKey) {
    throw new Error("TN360_API_KEY is not configured.");
  }

  const baseUrl = config.tn360ApiBase.replace(/\/+$/, "");

  const url =
    `${baseUrl}/v1/vehicles/stats?embed=vehicles&gps=true`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": config.tn360ApiKey,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `TN360 request failed with HTTP ${response.status}.`
    );
  }

  const body = (await response.json()) as Tn360VehicleStatsResponse[];

  if (!Array.isArray(body)) {
    throw new Error("TN360 returned an unexpected response.");
  }

  return body
    .filter((item) => item.vehicle?.registration)
    .map((item) => ({
      vehicleId: item.vehicle?.id ?? 0,
      vehicleName: item.vehicle?.name ?? "",
      registration: item.vehicle?.registration ?? "",
      location: item.location ?? null,
      updatedAt: item.updatedAt ?? null
    }));
}