import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getExtensionCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  // 仅允许 Chrome 扩展页跨域读取（避免普通网页跨域直接拉取敏感信息）
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

function isAuthorized(request: Request): boolean {
  const expected = process.env.DEVPORTAL_EXTENSION_API_KEY;
  if (!expected) return false;
  const got = request.headers.get("x-api-key") || "";
  return got === expected;
}

export async function GET(request: Request) {
  const corsHeaders = getExtensionCorsHeaders(request);
  if (!process.env.DEVPORTAL_EXTENSION_API_KEY) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500, headers: corsHeaders }
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const { searchParams } = new URL(request.url);
  const hostname = searchParams.get("hostname");

  if (!hostname) {
    return NextResponse.json(
      { error: "Hostname required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // 1. Find modules (sites) that likely match the hostname
    // Using contains for fuzzy match
    const modules = await prisma.module.findMany({
      where: {
        moduleUrl: {
          contains: hostname,
        },
      },
    });

    if (modules.length === 0) {
      return NextResponse.json([], { headers: corsHeaders });
    }

    const moduleIds = modules.map((m) => m.id);
    const projectIds = modules
      .map((m) => m.projectId)
      .filter((id): id is number => id !== null);

    // 2. Find accounts belonging to these modules
    const accounts = await prisma.account.findMany({
      where: {
        moduleId: {
          in: moduleIds,
        },
      },
    });

    // 3. Find related projects to get names
    const projects = await prisma.project.findMany({
      where: {
        id: {
          in: projectIds,
        },
      },
    });

    // 4. Transform and merge data
    // Return format: { id, projectName, username, password, site }
    const result = accounts.map((acc) => {
      const mod = modules.find((m) => m.id === acc.moduleId);
      const proj = mod?.projectId
        ? projects.find((p) => p.id === mod.projectId)
        : null;

      return {
        id: acc.id,
        projectName: proj?.projectName || mod?.moduleName || "Unknown Project",
        username: acc.account || "",
        password: acc.password || "",
        accountInfo: acc.accountInfo || "",
        remark: acc.remark || "",
        site: mod?.moduleUrl || "",
        description: mod?.moduleDescribe || "",
        // Extra info for UI clarity
        moduleName: mod?.moduleName, 
      };
    });

    return NextResponse.json(result, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Error matching credentials:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(request: Request) {
  const corsHeaders = getExtensionCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
