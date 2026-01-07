import { NextResponse } from "next/server";
import { moduleService } from "@/services/moduleService";
import { ModuleSaveDTO } from "@/types";

/**
 * @swagger
 * /api/project/add:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 添加模块
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: integer
 *               moduleName:
 *                 type: string
 *               moduleUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: ModuleSaveDTO = await request.json();
    const data = await moduleService.add(body);
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
