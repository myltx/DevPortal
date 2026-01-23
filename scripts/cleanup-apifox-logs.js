/* eslint-disable no-console */

const { PrismaClient } = require("@prisma/client");

function getCleanupEnabled() {
  const raw = process.env.DEVPORTAL_APIFOX_LOG_CLEANUP_ENABLED;
  if (raw == null || raw === "") return true;
  return raw !== "0" && String(raw).toLowerCase() !== "false";
}

function getKeepPerProject() {
  const raw = process.env.DEVPORTAL_APIFOX_LOG_KEEP_PER_PROJECT;
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return parsed;
}

async function cleanupByProjectId(prisma, projectId, keepPerProject) {
  const keep = Number.isFinite(keepPerProject) && keepPerProject > 0 ? keepPerProject : 10;

  const threshold = await prisma.apifoxSyncLog.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: keep - 1,
    take: 1,
    select: { id: true, createdAt: true },
  });

  if (threshold.length === 0) return 0;

  const cutoff = threshold[0];
  const deleteWhere = {
    projectId,
    OR: [
      { createdAt: { lt: cutoff.createdAt } },
      { AND: [{ createdAt: cutoff.createdAt }, { id: { lt: cutoff.id } }] },
    ],
  };

  const batchSize = 500;
  const maxBatches = 20;
  let deleted = 0;

  for (let i = 0; i < maxBatches; i += 1) {
    const candidates = await prisma.apifoxSyncLog.findMany({
      where: deleteWhere,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: batchSize,
      select: { id: true },
    });
    if (candidates.length === 0) break;

    const res = await prisma.apifoxSyncLog.deleteMany({
      where: { id: { in: candidates.map((x) => x.id) } },
    });
    deleted += res.count;

    if (candidates.length < batchSize) break;
  }

  return deleted;
}

async function main() {
  if (!getCleanupEnabled()) {
    console.log("[cleanup-apifox-logs] cleanup disabled (DEVPORTAL_APIFOX_LOG_CLEANUP_ENABLED=false)");
    return;
  }

  const keep = getKeepPerProject();
  const prisma = new PrismaClient();

  try {
    const projects = await prisma.apifoxSyncLog.findMany({
      distinct: ["projectId"],
      select: { projectId: true },
    });

    let totalDeleted = 0;
    for (const p of projects) {
      const deleted = await cleanupByProjectId(prisma, p.projectId, keep);
      totalDeleted += deleted;
      if (deleted > 0) {
        console.log(`[cleanup-apifox-logs] projectId=${p.projectId} deleted=${deleted} keep=${keep}`);
      }
    }

    console.log(`[cleanup-apifox-logs] done. projects=${projects.length} totalDeleted=${totalDeleted} keep=${keep}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("[cleanup-apifox-logs] failed:", e);
  process.exitCode = 1;
});

