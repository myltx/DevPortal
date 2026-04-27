import { NextResponse } from "next/server";
import { projectService } from "@/services/projectService";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
        throw new Error("ID is required");
    }

    const data = await projectService.remove(Number(id));
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
