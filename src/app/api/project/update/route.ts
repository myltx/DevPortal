import { NextRequest, NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { ModuleUpdateDTO } from "@/types";
import { createAuditLog, resolveProjectModule } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    // Normalize ID: Frontend might send 'id' instead of 'moduleId'
    if (!body.moduleId && body.id) {
        body.moduleId = body.id;
    }
    
    // Fetch info before update
    // Fetch info before update
    let moduleInfoStr = `ID: ${body.moduleId}`;
    let diffLog = "";
    
    // Safely prepare log info
    try {
        const mid = Number(body.moduleId);
        if (!isNaN(mid)) {
             // 1. Get Name via shared helper
             const resolvedName = await resolveProjectModule(mid);
             if (resolvedName) {
                 moduleInfoStr = resolvedName;
             }

             // 2. Diff Logic (Fetch moduleDescribe specifically)
             const m = await prisma.module.findUnique({
                where: { id: mid },
                select: { moduleDescribe: true } // Only need description for diff
             });
             
             if (m) {
                 // Compute text diff if description changed
                 if (body.moduleDescribe !== undefined && body.moduleDescribe !== null && body.moduleDescribe !== m.moduleDescribe) {
                     const oldLines = (m.moduleDescribe || "").split('\n').map(l => l.trim()).filter(Boolean);
                     const newLines = (body.moduleDescribe || "").split('\n').map(l => l.trim()).filter(Boolean);
                     
                     const added = newLines.filter(x => !oldLines.includes(x));
                     const removed = oldLines.filter(x => !newLines.includes(x));
                     
                     const changes = [];
                     if (added.length) changes.push(`新增: [${added.join(", ")}]`);
                     if (removed.length) changes.push(`移除: [${removed.join(", ")}]`);
                     
                     if (changes.length > 0) {
                         diffLog = ` (内容变更: ${changes.join("; ")})`;
                     } else if (body.moduleDescribe !== m.moduleDescribe) {
                         diffLog = " (内容已修改)";
                     }
                 }
             }
        }
    } catch (e) {
        console.error("Log prep failed:", e);
        // Continue to update even if log prep fails
    }

    const data = await moduleService.update(body);
    
    // Truncate if too long (Prisma String default is 191 chars usually, careful)
    const logMsg = `更新模块: ${moduleInfoStr}${diffLog}`;
    const truncatedMsg = logMsg.length > 180 ? logMsg.substring(0, 177) + "..." : logMsg;

    await createAuditLog(
      request, 
      "项目管理", 
      "更新项目", 
      truncatedMsg
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
