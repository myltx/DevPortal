import { NextRequest, NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
       return NextResponse.json(
        { code: 400, msg: "Missing id parameter", success: false },
        { status: 400 }
      );
    }

    // Fetch info BEFORE delete
    let moduleInfoStr = `ID: ${id}`;
    const mid = Number(id);
    if (mid) {
         const m = await prisma.module.findUnique({
            where: { id: mid },
            select: { moduleName: true, projectName: true }
         });
         if (m) {
             moduleInfoStr = `${m.projectName || "未知项目"}-${m.moduleName || "未知模块"}`;
         }
    }

    const data = await moduleService.deleteById(mid);

    await createAuditLog(
      request, 
      "项目管理", 
      "删除项目", 
      `删除模块: ${moduleInfoStr}`
    );

    return NextResponse.json({
      code: 200,
      msg: "success",
      data: data,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { code: 500, msg: "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}
