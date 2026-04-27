import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

export async function GET(request: Request) {
  const corsHeaders = getExtensionCorsHeaders(request);
  try {
    // 1. Try to read from manifest.json (Source of Truth)
    const fsVersion = getManifestVersion();

    // 2. Get download URL from DB (optional override)
    const urlConfig = await prisma.systemConfig.findUnique({
      where: { configKey: "extension_download_url" },
    });
    
    // 3. Construct default URL relative to current server
    let serverOrigin = "";
    
    // Priority 1: Environment Variable (Best for behind Proxy/Docker)
    if (process.env.PUBLIC_URL) {
      serverOrigin = process.env.PUBLIC_URL;
    } 
    // Priority 2: Proxy Headers (Standard)
    else {
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "http";
      if (host) {
        serverOrigin = `${proto}://${host}`;
      } else {
        // Priority 3: Fallback to Request URL (Internal Network)
        serverOrigin = new URL(request.url).origin;
      }
    }
    
    const defaultDownloadUrl = `${serverOrigin}/extension/chrome-extension-latest.zip`;

    // 4. Fallback to DB version if FS failed (optional, for backward compatibility)
    let dbVersion = null;
    if (!fsVersion) {
      const versionConfig = await prisma.systemConfig.findUnique({
         where: { configKey: "extension_version" },
      });
      dbVersion = versionConfig?.configValue;
    }

    return NextResponse.json(
      {
        version: fsVersion || dbVersion || "1.0",
        downloadUrl: urlConfig?.configValue || defaultDownloadUrl,
        forceUpdate: false,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to fetch extension version:", error);
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
