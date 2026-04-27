import { NextResponse } from "next/server";
import { areaService } from "@/services/areaService";

export async function POST(request: Request) {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (!id) {
          throw new Error("Missing id parameter");
      }
      
      const data = await areaService.delete(Number(id));
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
