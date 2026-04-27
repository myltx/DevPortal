import { prisma } from "@/lib/prisma";
import { ClassDTO, Class } from "@/types";

export const classService = {
  getClassInfo: async (dto: ClassDTO): Promise<Class[]> => {
    // If dto.id is provided, filter by it, otherwise findAll
    const where = dto.id ? { id: Number(dto.id) } : {};
    
    // Prisma returns correct types matching our interface if schema matches
    // Note: Project interface 'id' is number, Prisma is Int (number).
    const result = await prisma.class.findMany({
      where: where,
    });
    
    // Convert nulls to undefined or match structure if necessary.
    // Our interface expects non-nullable 'name' but DB is nullable?
    // Java entity said 'private String name;' which implies nullable in DB usually.
    // Interface: 'name: string'. We might need to cast or handle null.
    
    return result.map(item => ({
      id: item.id,
      name: item.name || "",
    }));
  },
};
