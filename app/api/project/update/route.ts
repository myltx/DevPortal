import { NextRequest, NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { ModuleUpdateDTO } from "@/types";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: ModuleUpdateDTO = await request.json();
    
    // Fetch info before update (or after, name usually doesn't change much or we want to log the target)
    let moduleInfoStr = `ID: ${body.moduleId}`;
    if (body.moduleId) {
         const m = await prisma.module.findUnique({
            where: { id: body.moduleId },
            select: { moduleName: true, projectName: true }
         });
         if (m) {
             moduleInfoStr = `${m.projectName || "未知项目"}-${m.moduleName || "未知模块"}`;
         }
    }

    const data = await moduleService.update(body);

    await createAuditLog(
      request, 
      "项目管理", 
      "更新项目", 
      `更新模块: ${moduleInfoStr}`
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
