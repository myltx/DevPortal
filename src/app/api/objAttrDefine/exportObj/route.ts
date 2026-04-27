import { NextResponse } from "next/server";
import { objAttrDefineService } from "@/services/objAttrDefineService";
import { ObjNameDTO } from "@/types";

/**
 * @swagger
 * /api/objAttrDefine/exportObj:
 *   post:
 *     tags:
 *       - 对象属性定义
 *     summary: 对象属性列表导出
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: File download
 */
export async function POST(request: Request) {
  try {
    const body: ObjNameDTO = await request.json();
    const buffer = await objAttrDefineService.exportObj(body);
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="object_attributes.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
