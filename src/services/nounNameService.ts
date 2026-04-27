import { prisma } from "@/lib/prisma";
import { NounNameDTO, NounNameListDTO, NounNameVO } from "@/types";

export const nounNameService = {
  add: async (dto: NounNameDTO) => {
    return await prisma.$transaction(async (tx) => {
      const nounName = await tx.nounName.create({
        data: {
          name: dto.name,
          aliasName: dto.name, // Java copies dto.name to aliasName? No, checking Java code: BeanUtil.copyProperties(dto, nounName). If DTO has aliasName, it copies. DTO doesn't have aliasName. Java Entity has aliasName. DTO has name. Java code doesn't explicitly set aliasName. It might be null.
          description: dto.description,
          createTime: new Date(),
          updateTime: new Date(),
          operateUser: dto.operateUser,
          classId: dto.classId,
          englishName: dto.englishName,
          remark: dto.remark,
        },
      });

      if (dto.label && dto.label.length > 0) {
        await tx.label.createMany({
          data: dto.label.map((name) => ({
            name,
            nounNameId: nounName.id,
          })),
        });
      }

      return nounName.id;
    });
  },

  update: async (dto: NounNameDTO) => {
    if (!dto.id) throw new Error("ID is required");
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.nounName.findUnique({ where: { id: dto.id } });
      if (!existing) throw new Error("数据不存在");

      await tx.nounName.update({
        where: { id: dto.id },
        data: {
          name: dto.name,
          englishName: dto.englishName,
          description: dto.description,
          remark: dto.remark,
          classId: dto.classId,
          operateUser: dto.operateUser,
          updateTime: new Date(),
        },
      });

      await tx.label.deleteMany({ where: { nounNameId: dto.id } });

      if (dto.label && dto.label.length > 0) {
        await tx.label.createMany({
          data: dto.label.map((name) => ({
            name,
            nounNameId: dto.id!,
          })),
        });
      }

      return true;
    });
  },

  deleteById: async (id: number) => {
    return await prisma.$transaction(async (tx) => {
      await tx.nounName.delete({ where: { id } });
      await tx.label.deleteMany({ where: { nounNameId: id } });
      return true;
    });
  },

  selectList: async (dto: NounNameListDTO) => {
    const where: any = {};
    if (dto.classId) where.classId = dto.classId;
    if (dto.key) {
      where.OR = [
        { name: { contains: dto.key } },
        { englishName: { contains: dto.key } }, // Java might check aliasName too? Java Mapper XML usually defines this. Assuming name/englishName/aliasName.
      ];
    }

    const list = await prisma.nounName.findMany({
      where,
      orderBy: { createTime: "desc" },
    });

    const result: NounNameVO[] = [];
    for (const item of list) {
      const labels = await prisma.label.findMany({
        where: { nounNameId: item.id },
        select: { name: true },
      });

      result.push({
        id: item.id.toString(),
        name: item.name || "",
        label: labels.map((l) => l.name || ""),
        description: item.description || "",
        createTime: item.createTime ? item.createTime.toISOString() : undefined,
        updateTime: item.updateTime ? item.updateTime.toISOString() : undefined,
        operateUser: item.operateUser || "",
        classId: item.classId || undefined,
        englishName: item.englishName || "",
        remark: item.remark || "",
      });
    }
    return result;
  },

  labelList: async () => {
    const labels = await prisma.label.findMany({
      select: { name: true },
      distinct: ["name"],
    });
    return labels.map((l) => l.name || "").filter((n) => n);
  },
};
