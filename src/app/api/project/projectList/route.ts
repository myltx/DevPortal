import { NextResponse } from "next/server";
import { projectService } from "@/services/projectService";
import { ProjectListDTO } from "@/types";

/**
 * @swagger
 * /api/project/projectList:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 获取项目列表 (详细/含模块)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: ProjectListDTO = await request.json();
    const data = await projectService.projectList(body);
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
