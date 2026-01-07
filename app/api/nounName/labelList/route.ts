import { NextResponse } from "next/server";
import { nounNameService } from "@/services/nounNameService";

/**
 * @swagger
 * /api/nounName/labelList:
 *   post:
 *     tags:
 *       - 项目命名
 *     summary: 标签列表
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST() {
  try {
    const result = await nounNameService.labelList();
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
