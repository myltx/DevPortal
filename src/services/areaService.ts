import { prisma } from "@/lib/prisma";

export const areaService = {
  // Get all areas with sorting
  getList: async () => {
    return await prisma.area.findMany({
      orderBy: {
        sort: "asc", 
      },
      include: {
        _count: {
          select: { projects: true, modules: true },
        },
      },
    });
  },

  // Add new area
  add: async (name: string, sort: number = 0) => {
    return await prisma.area.create({
      data: { name, sort },
    });
  },

  // Update area (includes Batch Update for Project/Module dual-write consistency)
  update: async (id: number, name: string, sort: number) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Get old area to know if name changed
        const oldArea = await tx.area.findUnique({ where: { id } });
        
        // 2. Update Area
        const area = await tx.area.update({
            where: { id },
             data: { name, sort },
        });

        // 3. If name changed, Batch Update Projects and Modules (Soft Link Sync)
        if (oldArea && oldArea.name !== name) {
            console.log(`Renaming Area ${oldArea.name} -> ${name}. Syncing legacy fields...`);
            
            // Sync Projects by ID (Hard Link) -> Update Name (Soft Link Legacy)
            // Actually, we should update those where areaId matches THIS area.
            // Dual Write: Ensures areaName column is always in sync with Area.name
            await tx.project.updateMany({
                where: { areaId: id },
                data: { areaName: name }
            });

            await tx.module.updateMany({
                where: { areaId: id },
                data: { areaName: name }
            });
        }
        
        return area;
    });
  },

  // Delete area
  delete: async (id: number) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Set areaId to null and areaName to null (or empty?) for related projects
        // We'll set to null to indicate "No Area"
        await tx.project.updateMany({
            where: { areaId: id },
            data: { areaId: null, areaName: null }
        });
        
        await tx.module.updateMany({
            where: { areaId: id },
            data: { areaId: null, areaName: null }
        });

        // 2. Delete Area
        return await tx.area.delete({
            where: { id },
        });
    });
  },
};
