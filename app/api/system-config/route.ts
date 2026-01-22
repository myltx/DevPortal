import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Remove extension_version from writable keys
const ALLOWED_KEYS = new Set(["extension_download_url"]);

function getManifestVersion(): string | null {
  try {
    const manifestPath = path.join(process.cwd(), "chrome-extension", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(content);
      return manifest.version || null;
    }
  } catch (error) {
    console.error("Failed to read manifest.json:", error);
  }
  return null;
}

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        configKey: {
          in: ["extension_version", "extension_download_url"],
        },
      },
    });

    const result = configs.reduce((acc, curr) => {
      acc[curr.configKey] = curr.configValue || "";
      return acc;
    }, {} as Record<string, string>);

    // Override version with actual file version
    const fileVersion = getManifestVersion();
    if (fileVersion) {
      result["extension_version"] = fileVersion;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch config error:", error);
    return NextResponse.json(
      { error: "Failed to fetch configs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const configKeys = Object.keys(body).filter((k) => ALLOWED_KEYS.has(k));
    if (configKeys.length === 0) {
      return NextResponse.json({ error: "No allowed keys" }, { status: 400 });
    }
    const changeDetails: string[] = [];

    // 1. Fetch current values BEFORE update to calculate diff
    let currentMap: Map<string, string | null> = new Map();
    try {
        const currentConfigs = await prisma.systemConfig.findMany({
          where: { configKey: { in: configKeys } },
        });
        currentMap = new Map(currentConfigs.map(c => [c.configKey, c.configValue]));
    } catch (e) {
        console.error("Config fetch failed", e);
    }
    
    const updates = [];

    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_KEYS.has(key)) continue;
      if (typeof value === "string") {
        try {
            const oldValue = currentMap.get(key) || "(empty)";
            if (oldValue !== value) {
                const labelMap: Record<string, string> = {
                    extension_download_url: "下载地址"
                };
                const label = labelMap[key] || key;
                changeDetails.push(`${label}: '${oldValue}' -> '${value}'`);
            }
        } catch (e) { console.error("Diff calc failed", e); }

        updates.push(
          prisma.systemConfig.upsert({
            where: { configKey: key },
            update: { configValue: value },
            create: {
              configKey: key,
              configValue: value,
              description:
              description: "扩展下载地址",
            },
          })
        );
      }
    }

    await prisma.$transaction(updates);

    // Create Audit Log only if there are changes
    if (changeDetails.length > 0) {
      await createAuditLog(
        request,
        "系统配置",
        "更新配置",
        `配置变更: ${changeDetails.join("; ")}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update config error:", error);
    // Log failure
    // Note: In a real world scenario, you might want to create a failed audit log here too
    return NextResponse.json(
      { error: "Failed to update configs" },
      { status: 500 }
    );
  }
}
