import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

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
    const configKeys = Object.keys(body);

    // 1. Fetch current values BEFORE update to calculate diff
    const currentConfigs = await prisma.systemConfig.findMany({
      where: { configKey: { in: configKeys } },
    });
    
    const currentMap = new Map(currentConfigs.map(c => [c.configKey, c.configValue]));
    const changeDetails: string[] = [];
    const updates = [];

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        const oldValue = currentMap.get(key) || "(empty)";
        if (oldValue !== value) {
            const labelMap: Record<string, string> = {
                extension_version: "Chrome扩展版本号",
                extension_download_url: "下载地址"
            };
            const label = labelMap[key] || key;
            changeDetails.push(`${label}: '${oldValue}' -> '${value}'`);
        }

        updates.push(
          prisma.systemConfig.upsert({
            where: { configKey: key },
            update: { configValue: value },
            create: {
              configKey: key,
              configValue: value,
              description:
                key === "extension_version"
                  ? "Chrome扩展版本号"
                  : "扩展下载地址",
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

