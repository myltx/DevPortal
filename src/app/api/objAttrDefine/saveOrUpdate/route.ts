import { NextResponse } from "next/server";
import { objAttrDefineService } from "@/services/objAttrDefineService";
import { ObjAttDefineSaveOrUpdateDTO } from "@/types";

/**
 * @swagger
 * /api/objAttrDefine/saveOrUpdate:
 *   post:
 *     tags:
 *       - 对象属性定义
 *     summary: 新增/修改对象信息/属性
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
    const body: ObjAttDefineSaveOrUpdateDTO = await request.json();
    const result = await objAttrDefineService.saveOrUpdate(body);
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
