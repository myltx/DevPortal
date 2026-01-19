import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: number[] = await request.json();

    // Fetch details before deletion
    const accounts = await prisma.account.findMany({
        where: { id: { in: body } },
        select: { account: true, moduleId: true }
    });

    const moduleIds = Array.from(new Set(accounts.map(a => a.moduleId).filter(Boolean) as number[]));
    const modules = await prisma.module.findMany({
        where: { id: { in: moduleIds } },
        select: { id: true, moduleName: true, projectName: true }
    });
    
    const moduleMap = new Map(modules.map(m => [m.id, m]));

    const logDetails = accounts.map(acc => {
        const m = acc.moduleId ? moduleMap.get(acc.moduleId) : null;
        const prefix = m ? `${m.projectName || ""}-${m.moduleName || ""}` : "未知模块";
        return `${prefix}-${acc.account}`;
    }).join(", ");

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
