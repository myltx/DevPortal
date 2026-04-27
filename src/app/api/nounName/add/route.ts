import { NextResponse } from "next/server";
import { nounNameService } from "@/services/nounNameService";
import { NounNameDTO } from "@/types";

/**
 * @swagger
 * /api/nounName/add:
 *   post:
 *     tags:
 *       - 项目命名
 *     summary: 新增项目名字
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: NounNameDTO = await request.json();
    const result = await nounNameService.add(body);
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
