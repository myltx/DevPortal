import { NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { ModuleUpdateDTO } from "@/types";

/**
 * @swagger
 * /api/project/update:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 更新模块
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleId:
 *                 type: integer
 *               moduleName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: ModuleUpdateDTO = await request.json();
    const data = await moduleService.update(body);
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
