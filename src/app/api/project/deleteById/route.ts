import { NextRequest, NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { createAuditLog, resolveProjectModule } from "@/lib/audit";

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

    const mid = Number(id);
    // Fetch details before deletion
    let moduleInfoStr = `ID: ${mid}`;
    try {
        if (!isNaN(mid)) {
             const resolved = await resolveProjectModule(mid);
             if (resolved) moduleInfoStr = resolved;
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
