import { NextResponse } from "next/server";
import { accountService } from "@/services/accountService";
import { AccountListDTO } from "@/types";

/**
 * @swagger
 * /api/project/accountList:
 *   post:
 *     tags:
 *       - 项目管理
 *     summary: 获取账号列表
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moduleId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: AccountListDTO = await request.json();
    const data = await accountService.accountList(body);
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
