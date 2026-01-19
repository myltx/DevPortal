import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: number[] = await request.json();

    // Fetch details before deletion
    let logDetails = "";
    try {
        const ids = body.map(id => Number(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
            const accounts = await prisma.account.findMany({
                where: { id: { in: ids } },
                select: { account: true, moduleId: true }
            });

            const moduleIds = Array.from(new Set(accounts.map(a => a.moduleId).filter(Boolean) as number[]));
            const modules = await prisma.module.findMany({
                where: { id: { in: moduleIds } },
                select: { id: true, moduleName: true, projectId: true }
            });
            
            const projectIds = Array.from(new Set(modules.map(m => m.projectId).filter(Boolean) as number[]));
            const projects = await prisma.project.findMany({
                where: { id: { in: projectIds } },
                select: { id: true, projectName: true }
            });
            const projectMap = new Map(projects.map(p => [p.id, p]));
            
            const moduleMap = new Map(modules.map(m => [m.id, {
                moduleName: m.moduleName,
                projectName: m.projectId ? projectMap.get(m.projectId)?.projectName : null
            }]));

            logDetails = accounts.map(acc => {
                const m = acc.moduleId ? moduleMap.get(acc.moduleId) : null;
                const prefix = m ? `${m.projectName || "未命名项目"}-${m.moduleName || "未命名模块"}` : "未知模块";
                return `${prefix}-${acc.account}`;
            }).join(", ");
        }
    } catch (e) {
        console.error("Log prep failed:", e);
    }
    
    // Fallback if log details failed
    if (!logDetails) logDetails = `ID: ${body.join(", ")}`;

    const data = await accountService.deleteAccount(body);

    await createAuditLog(
      request, 
      "账号管理", 
      "删除账号", 
      `删除账号: ${logDetails}`
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
