import { NextResponse } from "next/server";
import { objAttrDefineService } from "@/services/objAttrDefineService";
import { ImportObjDTO } from "@/types";
import * as XLSX from "xlsx";

/**
 * @swagger
 * /api/objAttrDefine/import:
 *   post:
 *     tags:
 *       - 对象属性定义
 *     summary: 对象属性导入
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("File not found");
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Map Excel columns to ImportObjDTO
    // Assuming headers match DTO Excel annotations or close enough?
    // User's Java code uses EasyPOI with @Excel annotations. 
    // We need to map manually or expect headers: "对象名称", "对象key", etc.
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    // Simple mapper
    const list: ImportObjDTO[] = [];
    // Assuming first row is header
    const headers = jsonData[0];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        const dto: ImportObjDTO = {};
        // Map based on index of header
        // Simple manual mapping if order varies? Or assume fixed order?
        // Let's assume headers are present
        headers.forEach((h: string, idx: number) => {
            if (h === "对象名称") dto.objName = row[idx];
            if (h === "对象key") dto.objKey = row[idx];
            if (h === "对象描述") dto.objRemark = row[idx];
            if (h === "属性名") dto.attrName = row[idx];
            if (h === "属性key") dto.attrKey = row[idx];
            if (h === "属性类型") dto.attrType = row[idx];
            if (h === "必填") dto.required = row[idx]; // Might be "1" or 1
            if (h === "属性描述") dto.remark = row[idx];
        });
        list.push(dto);
    }

    const result = await objAttrDefineService.importObj(list);
    return NextResponse.json({ code: 200, msg: "success", data: result, success: true });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: String(error), success: false });
  }
}
