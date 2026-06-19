import type { HttpRequest, HttpResponseInit } from "@azure/functions";
import { getConfig } from "./config";
import { jsonResponse } from "./http";

export type StaffRole = "Admin" | "Scheduler" | "Viewer";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: StaffRole[];
}

export function validateAuthenticatedRequest(request: HttpRequest): HttpResponseInit | null {
  if (!getConfig().requireAuth) {
    return null;
  }

  const userId = request.headers.get("x-ms-client-principal-id");
  const email = request.headers.get("x-ms-client-principal-name");

  if (!userId || !email) {
    return jsonResponse({ errors: ["Authenticated staff user is required."] }, 401);
  }

  return null;
}

export function validateRole(request: HttpRequest, allowedRoles: StaffRole[]): HttpResponseInit | null {
  if (!getConfig().requireAuth) {
    return null;
  }

  const authError = validateAuthenticatedRequest(request);
  if (authError) return authError;

  const roles = getRequestRoles(request);
  const isAllowed = roles.some((role) => allowedRoles.includes(role));

  if (!isAllowed) {
    return jsonResponse({ errors: ["User does not have permission for this action."] }, 403);
  }

  return null;
}

function getRequestRoles(request: HttpRequest): StaffRole[] {
  const rawRoles = request.headers.get("x-ms-client-principal-roles") ?? "";
  return rawRoles
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is StaffRole => role === "Admin" || role === "Scheduler" || role === "Viewer");
}
