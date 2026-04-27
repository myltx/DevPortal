import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { createAuditLog, resolveProjectModule } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const moduleId = Number(body?.moduleId);
    const items = Array.isArray(body?.items) ? body.items : [];

    const data = await accountService.batchImport({
      moduleId,
      items,
    });

    // Audit log（不记录密码明文）
    let moduleDetails = `(模块ID: ${moduleId})`;
    try {
      const resolved = await resolveProjectModule(moduleId);
      if (resolved) moduleDetails = resolved;
    } catch (e) {
      // ignore log errors
    }

    await createAuditLog(
      request,
      "账号管理",
      "批量导入账号",
      `批量导入账号: ${moduleDetails} (total=${data.total}, deduped=${data.deduped}, created=${data.created}, skippedExisting=${data.skippedExisting}, invalid=${data.invalid})`,
    );

    return NextResponse.json({
      code: 200,
      msg: "success",
      data,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { code: 500, msg: "Internal Server Error", success: false },
      { status: 500 },
    );
  }
}

