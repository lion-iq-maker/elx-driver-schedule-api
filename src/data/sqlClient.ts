import sql from "mssql";
import { getConfig } from "../shared/config";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function isSqlConfigured(): boolean {
  return Boolean(getConfig().sqlConnectionString);
}

export async function getSqlPool(): Promise<sql.ConnectionPool> {
  const connectionString = getConfig().sqlConnectionString;
  if (!connectionString) {
    throw new Error("SQL_CONNECTION_STRING is not configured.");
  }

  poolPromise ??= sql.connect(connectionString);
  return poolPromise;
}

export { sql };
