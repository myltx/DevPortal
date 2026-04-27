import { NextResponse } from "next/server";
import { projectService } from "@/services/projectService";

/**
 * @swagger
 * /api/project/areaList:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 获取区域列表
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const data = await projectService.areaList();
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
