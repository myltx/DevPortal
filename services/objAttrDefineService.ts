import { prisma } from "@/lib/prisma";
import {
  ImportObjDTO,
  ObjAttDefineDTO,
  ObjAttDefineSaveOrUpdateDTO,
  ObjectAttrDefineVO,
  ObjInfoVO,
  ObjNameDTO,
} from "@/types";
import * as XLSX from "xlsx";

export const objAttrDefineService = {
  // Page<ObjectAttrDefineVO>
  objList: async (dto: ObjNameDTO) => {
    // Determine page and size
    const page = dto.page || 1;
    const size = dto.size || 10;
    const skip = (page - 1) * size;

    // Filter? dto.name?
    // Java Mapper: likely filters by objName or attrName?
    // Let's assume filter by objName via ObjectInfo or attrName.
    // Without strict relation, filtering is tricky.
    // Logic: Find all ObjAttrDefine, then join with ObjectInfo.
    
    // Efficient way:
    // 1. If filtering by objName, find matching ObjectInfo IDs first.
    // 2. Then find ObjAttrDefine with those IDs.
    
    let objIds: number[] | undefined;
    if (dto.name) {
      const objects = await prisma.objectInfo.findMany({
        where: { objName: { contains: dto.name } },
        select: { id: true },
      });
      objIds = objects.map((o) => o.id);
      if (objIds.length === 0) {
        return { records: [], total: 0, current: page, size };
      }
    }

    const where: any = {};
    if (objIds) {
      where.objId = { in: objIds };
    }

    const total = await prisma.objAttrDefine.count({ where });
    const list = await prisma.objAttrDefine.findMany({
      where,
      skip,
      take: size,
      orderBy: { id: "desc" }, // or addTime
    });

    // Populate VO
    const result: ObjectAttrDefineVO[] = [];
    for (const item of list) {
      const objInfo = item.objId
        ? await prisma.objectInfo.findUnique({ where: { id: item.objId } })
        : null;

      result.push({
        id: item.id,
        objId: item.objId || undefined,
        objName: objInfo?.objName || "",
        objKey: objInfo?.objKey || "",
        objRemark: objInfo?.remark || "",
        objAddTime: objInfo?.addTime ? objInfo.addTime.toISOString() : undefined,
        attrName: item.attrName || "",
        attrKey: item.attrKey || "",
        attrType: item.attrType || "",
        required: item.required ? "true" : "false", // VO string?
        remark: item.remark || "",
        addTime: item.addTime ? item.addTime.toISOString() : undefined,
      });
    }

    return {
      records: result,
      total,
      current: page,
      size,
    };
  },

  saveOrUpdate: async (dto: ObjAttDefineSaveOrUpdateDTO) => {
    return await prisma.$transaction(async (tx) => {
      let infoId = dto.id;
      if (!infoId) {
        // Create
        const info = await tx.objectInfo.create({
          data: {
            objName: dto.objName,
            objKey: dto.objKey,
            remark: dto.objRemark,
            addTime: new Date(),
          },
        });
        infoId = info.id;
      } else {
        // Update
        await tx.objectInfo.update({
          where: { id: infoId },
          data: {
            objName: dto.objName,
            objKey: dto.objKey,
            remark: dto.objRemark,
            addTime: new Date(),
          },
        });
        // Delete existing attrs
        await tx.objAttrDefine.deleteMany({ where: { objId: infoId } });
      }

      // Save attrs
      if (dto.objAttDefineDTOList && dto.objAttDefineDTOList.length > 0) {
        await tx.objAttrDefine.createMany({
          data: dto.objAttDefineDTOList.map((attr) => ({
            objId: infoId!,
            attrKey: attr.attrKey,
            attrName: attr.attrName,
            attrType: attr.attrType,
            remark: attr.remark,
            required: attr.required, // boolean
            addTime: new Date(),
          })),
        });
      }

      return infoId;
    });
  },

  objectInfoList: async (dto: ObjNameDTO) => {
    const where: any = {};
    if (dto.name) {
      where.objName = { contains: dto.name };
    }

    const list = await prisma.objectInfo.findMany({
      where,
      orderBy: { id: "desc" },
    });

    const result: ObjInfoVO[] = [];
    for (const info of list) {
      const attrs = await prisma.objAttrDefine.findMany({
        where: { objId: info.id },
      });

      result.push({
        id: info.id,
        objName: info.objName || "",
        objKey: info.objKey || "",
        objRemark: info.remark || "",
        objAttDefineDTOList: attrs.map((a) => ({
          id: a.id,
          attrName: a.attrName || "",
          attrKey: a.attrKey || "",
          attrType: a.attrType || "",
          required: a.required || false,
          remark: a.remark || "",
        })),
      });
    }
    return result;
  },

  deleteById: async (id: number) => {
    await prisma.objAttrDefine.delete({ where: { id } });
    return true;
  },

  importObj: async (data: ImportObjDTO[]) => {
    // Logic: Loop list. Find or convert.
    // N+1 heavy but safe.
    for (const dto of data) {
      if (!dto.objName || !dto.objKey) continue;
      
      let info = await prisma.objectInfo.findFirst({
        where: { objName: dto.objName, objKey: dto.objKey },
      });

      if (!info) {
        info = await prisma.objectInfo.create({
          data: {
            objName: dto.objName,
            objKey: dto.objKey,
            remark: dto.objRemark,
            addTime: new Date(),
          },
        });
      }

      await prisma.objAttrDefine.create({
        data: {
          objId: info.id,
          attrType: dto.attrType,
          attrName: dto.attrName,
          attrKey: dto.attrKey,
          required: dto.required === 1, // Integer in DTO?
          remark: dto.remark,
          addTime: new Date(),
        },
      });
    }
    return true;
  },

  // Export buffer
  exportObj: async (dto: ObjNameDTO) => {
    // Re-use logic from objList but all?
    dto.page = 1;
    dto.size = 2000;
    const { records } = await objAttrDefineService.objList(dto);
    
    // Map to simple object for xlsx
    const data = records.map(r => ({
      "对象名称": r.objName,
      "对象key": r.objKey,
      "对象描述": r.objRemark,
      "属性名": r.attrName,
      "属性key": r.attrKey,
      "属性类型": r.attrType,
      "必填": r.required,
      "属性描述": r.remark,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    // Write to buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buf;
  }
};
