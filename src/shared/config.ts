export interface AppConfig {
  allowedOrigin: string;
  serviceName: string;
  sqlConnectionString: string | null;
  requireAuth: boolean;
}

export type DataSourceMode = "static-mock" | "azure-sql";

export function getConfig(): AppConfig {
  return {
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    serviceName: "driver-schedule-api",
    sqlConnectionString: process.env.SQL_CONNECTION_STRING ?? null,
    requireAuth: process.env.REQUIRE_AUTH === "true"
  };
}

export function getDataSourceMode(): DataSourceMode {
  return getConfig().sqlConnectionString ? "azure-sql" : "static-mock";
}

export function getSafeEnvironmentStatus() {
  const config = getConfig();

  return {
    dataSourceMode: getDataSourceMode(),
    isSqlConfigured: Boolean(config.sqlConnectionString),
    isAuthRequired: config.requireAuth,
    isCorsConfigured: Boolean(config.allowedOrigin),
    allowedOrigin: config.allowedOrigin
  };
}
