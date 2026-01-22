import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const projectName = searchParams.get("projectName");

    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (projectName) {
      where.projectName = {
        contains: projectName,
      };
    }

    const [total, records] = await Promise.all([
      prisma.apifoxSyncLog.count({ where }),
      prisma.apifoxSyncLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        records,
        page,
        pageSize,
      },
    });
  } catch (error: any) {
    console.error("[ApifoxLogsAPI] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
