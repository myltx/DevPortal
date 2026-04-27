import { prisma } from "@/lib/prisma";
import { ModuleSaveDTO, ModuleUpdateDTO } from "@/types";

export const moduleService = {
  add: async (dto: ModuleSaveDTO): Promise<number> => {
    // Dual Write Logic: Resolve Area Name and ID
    let areaId = dto.areaId;
    let areaName = Array.isArray(dto.areaName)
      ? (dto.areaName as string[]).join(",")
      : (dto.areaName as string);

    if (areaId) {
       const area = await prisma.area.findUnique({ where: { id: areaId } });
       if (area) {
         areaName = area.name; // Sync Name from ID source of truth
       }
    } else if (areaName) {
         // Try to find ID if only name provided (for robustness)
         const area = await prisma.area.findUnique({ where: { name: areaName } });
         if (area) {
             areaId = area.id;
         }
    }

    const created = await prisma.module.create({
      data: {
        projectId: dto.projectId,
        moduleName: dto.moduleName,
        moduleUrl: dto.moduleUrl,
        typeName: dto.typeName,
        moduleDescribe: dto.moduleDescribe,
        remark: dto.remark,
        areaName: areaName,
        areaId: areaId, // Save ID
        createTime: new Date(),
        updateTime: new Date(),
      },
    });
    return created.id;
  },
  
  update: async (dto: ModuleUpdateDTO): Promise<number> => {
    // Dual Write Logic
    let areaId = dto.areaId;
    let areaName = Array.isArray(dto.areaName)
      ? (dto.areaName as string[]).join(",")
      : (dto.areaName as string);

    if (areaId) {
       const area = await prisma.area.findUnique({ where: { id: areaId } });
       if (area) {
         areaName = area.name; 
       }
    } else if (areaName) {
         const area = await prisma.area.findUnique({ where: { name: areaName } });
         if (area) {
             areaId = area.id;
         }
    }

    const updated = await prisma.module.update({
      where: { id: dto.moduleId },
      data: {
        projectId: dto.projectId,
        moduleName: dto.moduleName,
        moduleUrl: dto.moduleUrl,
        typeName: dto.typeName,
        moduleDescribe: dto.moduleDescribe,
        remark: dto.remark,
        areaName: areaName,
        areaId: areaId, // Save ID
        updateTime: new Date(),
      },
    });
    return updated.id;
  },

  deleteById: async (id: number): Promise<boolean> => {
    await prisma.module.delete({
      where: { id: id },
    });
    return true;
  },
};
