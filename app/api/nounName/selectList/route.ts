import { NextResponse } from "next/server";
import { nounNameService } from "@/services/nounNameService";
import { NounNameListDTO } from "@/types";

/**
 * @swagger
 * /api/nounName/selectList:
 *   post:
 *     tags:
 *       - 项目命名
 *     summary: 列表查询
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classId:
 *                 type: integer
 *               key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: NounNameListDTO = await request.json();
    const result = await nounNameService.selectList(body);
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
