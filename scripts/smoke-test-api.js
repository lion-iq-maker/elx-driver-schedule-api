const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:7071";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
}

function assertStatus(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`${label}: ${actual}`);
}

async function main() {
  const health = await request("/api/health");
  assertStatus("GET /api/health", health.response.status, 200);

  const blocked = await request("/api/health", {
    headers: { Origin: "https://blocked.example.com" }
  });
  assertStatus("Blocked CORS origin", blocked.response.status, 403);

  const allowed = await request("/api/health", {
    headers: { Origin: "http://localhost:5173" }
  });
  assertStatus("Allowed CORS origin", allowed.response.status, 200);

  const lookups = await request("/api/driver-schedule/lookups");
  assertStatus("GET /api/driver-schedule/lookups", lookups.response.status, 200);

  const schedules = await request("/api/driver-schedule/schedules?start=2026-06-18&end=2026-06-25");
  assertStatus("GET /api/driver-schedule/schedules", schedules.response.status, 200);

  const createBody = {
    driverId: "33333333-3333-4333-8333-333333333333",
    truckId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    trailerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    loadPlanNumber: `LP-SMOKE-${Date.now()}`,
    customerName: "Smoke Test Customer",
    pickupLocation: "Adelaide DC",
    deliveryLocation: "Sydney DC",
    startDateTimeUtc: "2026-06-24T08:00:00.000Z",
    endDateTimeUtc: "2026-06-25T17:00:00.000Z",
    status: "Scheduled",
    conNote: "CN-SMOKE",
    notes: "API smoke test."
  };

  const created = await request("/api/driver-schedule/schedules", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(createBody)
  });
  assertStatus("POST /api/driver-schedule/schedules", created.response.status, 201);

  const id = created.body.item.id;
  const audit = await request(`/api/driver-schedule/audit?entityId=${id}`);
  assertStatus("GET /api/driver-schedule/audit", audit.response.status, 200);

  const deleted = await request(`/api/driver-schedule/schedules/${id}`, {
    method: "DELETE"
  });
  assertStatus("DELETE /api/driver-schedule/schedules/{id}", deleted.response.status, 200);

  console.log("API smoke test passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
