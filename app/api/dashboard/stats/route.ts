import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      projectsCount,
      modulesCount,
      accountsCount,
      nounsCount,
      recentProjects,
      recentAccounts,
    ] = await prisma.$transaction([
      prisma.project.count(),
      prisma.module.count(),
      prisma.account.count(),
      prisma.nounName.count(),
      prisma.project.findMany({
        take: 5,
        orderBy: { updateTime: "desc" },
        include: { area: true },
      }),
      prisma.account.findMany({
        take: 5,
        orderBy: { id: "desc" }, // Assuming higher ID is newer since no updateTime
        select: {
          id: true,
          account: true,
          moduleId: true,
          remark: true,
        },
      }),
    ]);

    return NextResponse.json({
      counts: {
        projects: projectsCount,
        modules: modulesCount,
        accounts: accountsCount,
        nouns: nounsCount,
      },
      recentProjects,
      recentAccounts,
    });
  } catch (error) {
    console.error("Dashboard stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
