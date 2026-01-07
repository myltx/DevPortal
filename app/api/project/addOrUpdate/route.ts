import { NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { AccountDTO } from "@/types";

/**
 * @swagger
 * /api/project/addOrUpdate:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 添加或更新账号
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               account:
 *                 type: string
 *               password:
 *                 type: string
 *               moduleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: AccountDTO = await request.json();
    const data = await accountService.addOrUpdate(body);
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
