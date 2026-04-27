import { NextResponse } from "next/server";
import { projectService } from "@/services/projectService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, projectName, sort, projectDescribe } = body;
    const data = await projectService.update(id, projectName, sort, projectDescribe);
    return NextResponse.json({
      code: 200,
      msg: "success",
      data: data,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : "Internal Server Error", success: false },
      { status: 500 }
    );
  }
}
