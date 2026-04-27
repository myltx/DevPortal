import { NextResponse } from "next/server";
import { areaService } from "@/services/areaService";

export async function POST() {
  try {
    const data = await areaService.getList();
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
