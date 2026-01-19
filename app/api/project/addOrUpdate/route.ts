import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { AccountDTO } from "@/types";
import { createAuditLog, resolveProjectModule } from "@/lib/audit";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: AccountDTO = await request.json();
    const data = await accountService.addOrUpdate(body);

    // Fetch module info for detailed log
    let moduleDetails = `(模块ID: ${body.moduleId})`;
    
    // Use shared helper
    const resolvedContext = await resolveProjectModule(body.moduleId);
    if (resolvedContext) {
        moduleDetails = resolvedContext;
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
