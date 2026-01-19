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

    // Extract User Name from header (client-side passed)
    // In a real app, this would come from a session/token
    const userName = req.headers.get("x-user-name") || "System";

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
