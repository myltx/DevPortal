import { NextResponse } from "next/server";
import { areaService } from "@/services/areaService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await areaService.update(body.id, body.name, body.sort);
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
