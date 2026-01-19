import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Creates an audit log entry.
 *
 * @param req The NextRequest object (used to extract IP and optional user header)
 * @param module The module name (e.g., "SystemConfig", "Account")
 * @param action The action performed (e.g., "UPDATE", "DELETE")
 * @param description Optional details about the change
 * @param status 1 for success, 0 for failure (default 1)
 */
export async function createAuditLog(
  req: NextRequest,
  module: string,
  action: string,
  description?: string,
  status: number = 1
) {
  try {
    // Extract IP address
    let ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    // Normalize IPv6 localhost to IPv4
    if (ip === "::1") {
        ip = "127.0.0.1";
    }

    // Extract User Name from header (client-side passed)
    // Support URL-encoded header for non-ASCII characters
    let userNameRaw = req.headers.get("x-user-name") || "System";
    let userName = userNameRaw;
    try {
        userName = decodeURIComponent(userNameRaw);
    } catch (e) {
        // failed to decode, keep raw
    }

    await prisma.auditLog.create({
      data: {
        action,
        module,
        description,
        userName,
        ipAddress: ip,
        status,
      },
    });
  } catch (error) {
    // Fail silently to not block the main business logic
    console.error("Failed to create audit log:", error);
  }
}
