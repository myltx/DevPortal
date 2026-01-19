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
    let moduleDetails = `(模块ID: ${body.moduleId})`;
    if (body.moduleId) {
        const moduleInfo = await prisma.module.findUnique({
            where: { id: body.moduleId },
            select: { moduleName: true, projectName: true }
        });
        if (moduleInfo) {
            moduleDetails = `${moduleInfo.projectName || "未命名"}项目的${moduleInfo.moduleName || "未命名"}模块`;
        }
    }

    const actionType = body.id ? "更新账号" : "新增账号";
    await createAuditLog(
        request, 
        "账号管理", 
        actionType, 
        `${actionType}: ${moduleDetails}的账号[${body.account}]`
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
