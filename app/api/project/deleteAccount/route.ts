import { NextResponse } from "next/server";
import { accountService } from "@/services/accountService";

/**
 * @swagger
 * /api/project/deleteAccount:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 删除账号
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: number[] = await request.json();
    const data = await accountService.deleteAccount(body);
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
