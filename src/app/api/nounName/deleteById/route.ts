import { NextResponse } from "next/server";
import { nounNameService } from "@/services/nounNameService";

/**
 * @swagger
 * /api/nounName/deleteById:
 *   post:
 *     tags:
 *       - 项目命名
 *     summary: 删除项目名字
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new Error("ID required");

    const result = await nounNameService.deleteById(Number(id));
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
