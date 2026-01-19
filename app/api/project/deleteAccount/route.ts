import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { createAuditLog, resolveProjectModule } from "@/lib/audit";
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

            // Parallel resolve of module names using helper
            const resolvedList = await Promise.all(accounts.map(async (acc) => {
                const prefix = await resolveProjectModule(acc.moduleId);
                return `${prefix || "未知模块"}-${acc.account}`;
            }));
            
            logDetails = resolvedList.join(", ");
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
