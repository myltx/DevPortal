import { NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";

/**
 * @swagger
 * /api/project/deleteById:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 根据 ID 删除模块
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
       return NextResponse.json(
        { code: 400, msg: "Missing id parameter", success: false },
        { status: 400 }
      );
    }

    const data = await moduleService.deleteById(Number(id));
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
