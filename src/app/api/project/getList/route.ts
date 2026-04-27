import { NextResponse } from "next/server";
import { projectService } from "@/services/projectService";

/**
 * @swagger
 * /api/project/getList:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 获取项目列表 (简单)
 *     parameters:
 *       - in: query
 *         name: classId
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
    const classId = searchParams.get("classId");

    if (!classId) {
       return NextResponse.json(
        { code: 400, msg: "Missing classId parameter", success: false },
        { status: 400 }
      );
    }

    const data = await projectService.getList(Number(classId));
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
