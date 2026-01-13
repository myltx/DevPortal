
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Area Migration...');

  // 1. Get all unique area names from Project
  const projects = await prisma.project.findMany({
    select: { areaName: true },
    where: { areaName: { not: null } }
  });

  // 2. Get all unique area names from Module
  const modules = await prisma.module.findMany({
    select: { areaName: true },
    where: { areaName: { not: null } }
  });

  // 3. Merge and Deduplicate
  const allNames = new Set<string>();
  projects.forEach(p => p.areaName && allNames.add(p.areaName));
  modules.forEach(m => m.areaName && allNames.add(m.areaName));

  console.log(`Found ${allNames.size} unique areas:`, Array.from(allNames));

  // 4. Create Areas in DB
  const areaNameIdMap = new Map<string, number>();

  for (const name of allNames) {
    if (!name.trim()) continue;

    // Special sorting rule: 'doc' or '文档' goes to bottom (sort 999)
    let sort = 0;
    if (name.toLowerCase().includes('doc') || name.includes('文档')) {
        sort = 999;
    } else if (name === '其他') {
        sort = 900;
    }

    const area = await prisma.area.upsert({
      where: { name },
      update: {}, // Don't update if exists
      create: { name, sort },
    });
    
    console.log(`Created/Found Area: ${area.name} (ID: ${area.id})`);
    areaNameIdMap.set(name, area.id);
  }

  // 5. Update Projects (Link via ID)
  console.log('Updating Projects...');
  const projectsToUpdate = await prisma.project.findMany({ where: { areaName: { not: null } } });
  for (const p of projectsToUpdate) {
    if (p.areaName && areaNameIdMap.has(p.areaName)) {
      await prisma.project.update({
        where: { id: p.id },
        data: { areaId: areaNameIdMap.get(p.areaName) }
      });
    }
  }

  // 6. Update Modules (Link via ID)
  console.log('Updating Modules...');
  const modulesToUpdate = await prisma.module.findMany({ where: { areaName: { not: null } } });
  for (const m of modulesToUpdate) {
    if (m.areaName && areaNameIdMap.has(m.areaName)) {
      await prisma.module.update({
        where: { id: m.id },
        data: { areaId: areaNameIdMap.get(m.areaName) }
      });
    }
  }

  console.log('✅ Migration Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
