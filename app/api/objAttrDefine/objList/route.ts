import { NextResponse } from "next/server";
import { objAttrDefineService } from "@/services/objAttrDefineService";
import { ObjNameDTO } from "@/types";

/**
 * @swagger
 * /api/objAttrDefine/objList:
 *   post:
 *     tags:
 *       - 对象属性定义
 *     summary: 对象属性列表
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               page:
 *                 type: integer
 *               size:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const body: ObjNameDTO = await request.json();
    const result = await objAttrDefineService.objList(body);
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
