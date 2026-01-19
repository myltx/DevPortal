import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // No caching

function getExtensionCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  if (origin.startsWith("chrome-extension://")) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "x-api-key, content-type",
      Vary: "Origin",
    };
  }
  return {};
}

export async function GET(request: Request) {
  const corsHeaders = getExtensionCorsHeaders(request);
  try {
    // Try to fetch from DB
    const versionConfig = await prisma.systemConfig.findUnique({
      where: { configKey: "extension_version" },
    });

    const urlConfig = await prisma.systemConfig.findUnique({
      where: { configKey: "extension_download_url" },
    });

    return NextResponse.json(
      {
      version: versionConfig?.configValue || "1.0", // Default to 1.0
      downloadUrl: urlConfig?.configValue || "",
      forceUpdate: false,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to fetch extension version:", error);
    // Fallback on error
    return NextResponse.json(
      {
        version: "1.0",
        downloadUrl: "",
        forceUpdate: false,
      },
      { headers: corsHeaders }
    );
  }
}

export async function OPTIONS(request: Request) {
  const corsHeaders = getExtensionCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
