import { NextResponse } from "next/server";
import { classService } from "@/services/classService";
import { ClassDTO } from "@/types";

/**
 * @swagger
 * /api/class/getClassInfo:
 *   post:
 *     tags:
 *       - 分类管理
 *     summary: 获取分类信息
 *     description: 根据 ID 获取分类详情
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: ClassDTO = await request.json();
    const data = await classService.getClassInfo(body);
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
