import { NextRequest, NextResponse } from "next/server";
import { apifoxSyncLogService } from "@/services/apifoxSyncLogService";

export const dynamic = "force-dynamic";

function getManualCleanupEnabled() {
  const raw = process.env.DEVPORTAL_APIFOX_LOG_MANUAL_CLEANUP_ENABLED;
  if (raw == null || raw === "") return false;
  return raw !== "0" && raw.toLowerCase() !== "false";
}

function getManualCleanupToken() {
  return process.env.DEVPORTAL_APIFOX_LOG_MANUAL_CLEANUP_TOKEN || "";
}

export async function POST(request: NextRequest) {
  try {
    if (!getManualCleanupEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "手动清理未启用（请设置 DEVPORTAL_APIFOX_LOG_MANUAL_CLEANUP_ENABLED=true）",
        },
        { status: 403 },
      );
    }

    const expectedToken = getManualCleanupToken();
    if (expectedToken) {
      const gotToken = request.headers.get("x-cleanup-token") || "";
      if (gotToken !== expectedToken) {
        return NextResponse.json(
          { success: false, error: "无权限：清理口令错误或缺失" },
          { status: 401 },
        );
      }
    }

    const startedAt = Date.now();
    const cfg = apifoxSyncLogService.getConfig();
    const result = await apifoxSyncLogService.cleanupAllProjects(
      cfg.keepPerProject,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        durationMs: Date.now() - startedAt,
        cleanedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ApifoxLogsCleanupAPI] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

