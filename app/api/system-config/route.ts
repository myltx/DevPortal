import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updates = [];

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update config error:", error);
    return NextResponse.json(
      { error: "Failed to update configs" },
      { status: 500 }
    );
  }
}
