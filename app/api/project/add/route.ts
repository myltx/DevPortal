import { NextRequest, NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { ModuleSaveDTO } from "@/types";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: ModuleSaveDTO = await request.json();
    const data = await moduleService.add(body);
    
    let projectContext = "";
    if (body.projectId) {
        const project = await prisma.project.findUnique({
            where: { id: body.projectId },
            select: { projectName: true }
        });
        if (project) {
            projectContext = ` (所属项目: ${project.projectName})`;
        }
    }

    await createAuditLog(
      request, 
      "项目管理", 
      "新增项目", 
      `新增模块: ${body.moduleName}${projectContext}`
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
