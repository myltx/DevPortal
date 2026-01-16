import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostname = searchParams.get("hostname");

  if (!hostname) {
    return NextResponse.json({ error: "Hostname required" }, { status: 400 });
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
      return NextResponse.json([]);
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
        site: mod?.moduleUrl || "",
        description: mod?.moduleDescribe || "",
        // Extra info for UI clarity
        moduleName: mod?.moduleName, 
      };
    });

    return NextResponse.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error matching credentials:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
