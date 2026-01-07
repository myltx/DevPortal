import { prisma } from "@/lib/prisma";
import { ModuleSaveDTO, ModuleUpdateDTO } from "@/types";

export const moduleService = {
  add: async (dto: ModuleSaveDTO): Promise<number> => {
    const created = await prisma.module.create({
      data: {
        projectId: dto.projectId,
        moduleName: dto.moduleName,
        moduleUrl: dto.moduleUrl,
        typeName: dto.typeName,
        moduleDescribe: dto.moduleDescribe,
        remark: dto.remark,
        areaName: dto.areaName,
        createTime: new Date(),
        updateTime: new Date(),
        // classId? Module schema didn't have classId but DTO did.
        // Let's check schema/Module.java. Module.java: id, moduleName... projectId...
        // ModuleSaveDTO: private Long classId;
        // The entity Module.java I read did NOT have classId.
        // So I will ignore it or it belongs to Project? 
        // User's Module.java: private Long projectId; (line 33)
        // No classId in Module.java.
      },
    });
    return created.id;
  },
  
  update: async (dto: ModuleUpdateDTO): Promise<number> => {
    const updated = await prisma.module.update({
      where: { id: dto.moduleId },
      data: {
        projectId: dto.projectId,
        moduleName: dto.moduleName,
        moduleUrl: dto.moduleUrl,
        typeName: dto.typeName,
        moduleDescribe: dto.moduleDescribe,
        remark: dto.remark,
        areaName: dto.areaName,
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
