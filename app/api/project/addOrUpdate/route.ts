import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { AccountDTO } from "@/types";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: AccountDTO = await request.json();
    const data = await accountService.addOrUpdate(body);

    // Fetch module info for detailed log
    // Fetch module info for detailed log
    let moduleDetails = `(模块ID: ${body.moduleId})`;
    let projectName = "";
    let moduleName = "";
    
    try {
        const mid = parseInt(String(body.moduleId), 10);
        if (!isNaN(mid)) {
            // 1. Get Module info (specifically projectId)
            const moduleInfo = await prisma.module.findUnique({
                where: { id: mid },
                select: { moduleName: true, projectId: true }
            });
            
            if (moduleInfo) {
                moduleName = moduleInfo.moduleName || "未命名模块";
                // 2. Get Project info via projectId
                if (moduleInfo.projectId) {
                    const projectInfo = await prisma.project.findUnique({
                        where: { id: moduleInfo.projectId },
                        select: { projectName: true }
                    });
                    projectName = projectInfo?.projectName || "未命名项目";
                } else {
                    projectName = "未命名项目";
                }
                moduleDetails = `${projectName}-${moduleName}`;
            } else {
                 console.warn(`[Audit] Module ID ${mid} not found in DB`);
            }
        }
    } catch (e) { 
        console.error("Log prep failed:", e);
    }

    const actionType = body.id ? "更新账号" : "新增账号";
    // user preferred format: 更新账号: Project-Module的账号[admin]
    const logContent = `${actionType}: ${moduleDetails}的账号[${body.account}]`;
    
    await createAuditLog(
        request, 
        "账号管理", 
        actionType, 
        logContent
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
