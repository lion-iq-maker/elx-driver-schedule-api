export interface AppConfig {
  allowedOrigin: string;
  serviceName: string;
  sqlConnectionString: string | null;
  requireAuth: boolean;

  // TN360 / Teletrac Navman
  tn360ApiKey: string | null;
  tn360ApiBase: string;
}

export type DataSourceMode = "static-mock" | "azure-sql";

export function getConfig(): AppConfig {
  return {
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    serviceName: "driver-schedule-api",
    sqlConnectionString: process.env.SQL_CONNECTION_STRING ?? null,
    requireAuth: process.env.REQUIRE_AUTH === "true",

    // TN360 settings are stored securely in Azure Function App settings.
    // Never expose the API key to the frontend.
    tn360ApiKey: process.env.TN360_API_KEY ?? null,
    tn360ApiBase:
      process.env.TN360_API_BASE ?? "https://api-au.telematics.com"
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
    allowedOrigin: config.allowedOrigin,

    // Safe diagnostic only.
    // This confirms TN360 is configured without ever exposing the key.
    isTn360Configured: Boolean(config.tn360ApiKey && config.tn360ApiBase)
  };
}