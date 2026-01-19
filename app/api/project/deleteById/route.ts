import { NextRequest, NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

// ... swagger comments ...

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
       return NextResponse.json(
        { code: 400, msg: "Missing id parameter", success: false },
        { status: 400 }
      );
    }

    // Fetch info BEFORE delete
    let moduleInfoStr = `ID: ${id}`;
    const mid = Number(id);
    
    try {
        if (!isNaN(mid)) {
             const m = await prisma.module.findUnique({
                where: { id: mid },
                select: { moduleName: true, projectId: true }
             });
             if (m) {
                 let pname = "未知项目";
                 if (m.projectId) {
                     const p = await prisma.project.findUnique({ where: { id: m.projectId }, select: { projectName: true } });
                     if (p?.projectName) pname = p.projectName;
                 }
                 moduleInfoStr = `${pname}-${m.moduleName || "未知模块"}`;
             }
        }
    } catch (e) {
        console.error("Log prep failed:", e);
    }

    const data = await moduleService.deleteById(mid);

    await createAuditLog(
      request, 
      "项目管理", 
      "删除项目", 
      `删除模块: ${moduleInfoStr}`
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
