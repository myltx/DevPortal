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

/**
 * Helper to resolve "ProjectName-ModuleName" from a Module ID.
 * Handles missing IDs, invalid IDs, and database lookups safely.
 */
export async function resolveProjectModule(moduleId: number | string | undefined | null): Promise<string> {
    if (!moduleId) return "";
    
    try {
        const mid = parseInt(String(moduleId), 10);
        if (isNaN(mid)) return "";

        const m = await prisma.module.findUnique({
            where: { id: mid },
            select: { moduleName: true, projectId: true }
        });

        if (!m) {
            console.warn(`[Audit] Module ID ${mid} not found`);
            return "";
        }

        let projectName = "未命名项目";
        if (m.projectId) {
            const p = await prisma.project.findUnique({
                where: { id: m.projectId },
                select: { projectName: true }
            });
            if (p?.projectName) projectName = p.projectName;
        }

        return `${projectName}-${m.moduleName || "未命名模块"}`;
    } catch (error) {
        console.error("Failed to resolve project/module:", error);
        return "";
    }
}
