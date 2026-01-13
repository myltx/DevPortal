import { prisma } from "@/lib/prisma";
import {
  Project,
  ProjectListDTO,
  ProjectAreaList,
  ProjectListVO,
} from "@/types";

export const projectService = {
  getList: async (classId: number): Promise<Project[]> => {
    // Prisma Model: Project
    // Interface: Project (id: number, ...)
    // Prisma returns Date for DateTime, interface string for createTime?
    // We need to map if our interface insists on string.
    // Let's check index.ts interface definitions.
    // Project interface: createTime: string. Prisma: Date.
    // We must format.
    
    // Also, schema map "project_name" -> projectName. Prisma Client will use camelCase if typical,
    // but we defined explicit @map. Wait, if I use @map("project_name"), the field in Prisma Client is `projectName` 
    // IF I defined `projectName String @map("project_name")`.
    // Yes, I did: `projectName String? @map("project_name")`. So field is `projectName`.
    
    const result = await prisma.project.findMany({
      where: {
        classId: classId,
      },
      orderBy: {
        sort: 'asc', // or as needed
      },
    });

    return result.map((p) => ({
      id: p.id,
      projectName: p.projectName || "",
      projectDescribe: p.projectDescribe || "",
      createTime: p.createTime ? p.createTime.toISOString() : "", // Simple ISO string or format? Java typically returns "2023-01-01 10:00:00" via JsonFormat?
      // Next.js usually handles ISO. Let's send ISO string for now or formatted.
      // Java was: @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss").
      // We should probably format it similarly if frontend expects it, or just use ISO.
      // Let's use ISO for simplicity or a simple replace.
      updateTime: p.updateTime ? p.updateTime.toISOString() : "",
      areaName: p.areaName || "",
      sort: p.sort || 0,
      classId: p.classId || 0,
    }));
  },

  projectList: async (dto: ProjectListDTO): Promise<ProjectAreaList[]> => {
    // Build where clause for Module
    const where: any = {};
    if (dto.moduleName) {
      where.moduleName = { contains: dto.moduleName };
    }
    if (dto.typeName) {
      where.typeName = dto.typeName;
    }
    if (dto.projectId) {
        where.projectId = Number(dto.projectId);
    }

    // Include Area relation for sorting and grouping
    const modules = await prisma.module.findMany({
      where,
      include: {
        area: true, // Fetch related Area
      }
    });
    
    // Collect project Ids
    const projectIds = [...new Set(modules.map(m => m.projectId).filter(id => id !== null))] as number[];
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } }
    });
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Group by Area
    // Map key: areaId (or name for "Others"), value: { sort, name, list }
    const groupMap = new Map<string, { sort: number, areaName: string, list: ProjectListVO[] }>();

    for (const m of modules) {
        const p = projectMap.get(m.projectId || 0);
        
        // Determine Area Info
        let areaName = m.area?.name || m.areaName || "其他";
        // Ensure "其他" is grouped correctly if area is missing
        if (!m.area && !m.areaName) areaName = "其他";

        let sort = m.area?.sort ?? (areaName === "其他" ? 900 : 0);
        // "DOC" fallback sort if no Area record found but name matches doc
        if (!m.area && (areaName.toLowerCase().includes('doc') || areaName.includes('文档'))) {
            sort = 999;
        }

        const vo: ProjectListVO = {
            projectId: m.projectId || 0,
            projectName: p?.projectName || "",
            moduleName: m.moduleName || "",
            moduleId: m.id,
            moduleUrl: m.moduleUrl || "",
            typeName: m.typeName || "",
            updateTime: m.updateTime ? m.updateTime.toISOString() : "",
            describe: m.moduleDescribe || "",
            remark: m.remark || "",
            areaName: areaName,
            areaId: m.areaId || m.area?.id, // Populate ID
        };
        
        if (!groupMap.has(areaName)) {
            groupMap.set(areaName, { sort, areaName, list: [] });
        }
        groupMap.get(areaName)?.list.push(vo);
    }
    
    // Convert to array and Sort
    const result: ProjectAreaList[] = Array.from(groupMap.values())
        .sort((a, b) => a.sort - b.sort) // Sort by Area.sort
        .map(g => ({ areaName: g.areaName, list: g.list }));
    
    return result;
  },

  areaList: async (): Promise<string[]> => {
    // Distinct area names from Project? or Module?
    // Java: projectService.areaList(). Likely project areas.
    const projects = await prisma.project.findMany({
        select: { areaName: true },
        distinct: ['areaName']
    });
    return projects.map(p => p.areaName || "").filter(Boolean);
  },
  // --- Project (Tab) Management ---

  add: async (projectName: string, classId: number, sort: number = 0, describe: string = "") => {
    return await prisma.project.create({
      data: {
        projectName,
        classId,
        sort,
        projectDescribe: describe,
        createTime: new Date(),
        updateTime: new Date(),
      },
    });
  },

  update: async (id: number, projectName: string, sort: number, describe: string) => {
    return await prisma.project.update({
      where: { id },
      data: {
        projectName,
        sort,
        projectDescribe: describe,
        updateTime: new Date(),
      },
    });
  },

  remove: async (id: number) => {
    return await prisma.project.delete({
      where: { id },
    });
  },
};
