import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // No caching

export async function GET() {
  try {
    // Try to fetch from DB
    const versionConfig = await prisma.systemConfig.findUnique({
      where: { configKey: "extension_version" },
    });

    const urlConfig = await prisma.systemConfig.findUnique({
      where: { configKey: "extension_download_url" },
    });

    return NextResponse.json({
      version: versionConfig?.configValue || "1.0", // Default to 1.0
      downloadUrl: urlConfig?.configValue || "",
      forceUpdate: false,
    });
  } catch (error) {
    console.error("Failed to fetch extension version:", error);
    // Fallback on error
    return NextResponse.json({
      version: "1.0",
      downloadUrl: "",
      forceUpdate: false,
    });
  }
}

