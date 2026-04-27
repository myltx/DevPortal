import { prisma } from "@/lib/prisma";

function getCleanupEnabled() {
  const raw = process.env.DEVPORTAL_APIFOX_LOG_CLEANUP_ENABLED;
  if (raw == null || raw === "") return true;
  return raw !== "0" && raw.toLowerCase() !== "false";
}

function getKeepPerProject() {
  const raw = process.env.DEVPORTAL_APIFOX_LOG_KEEP_PER_PROJECT;
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return parsed;
}

export const apifoxSyncLogService = {
  getConfig() {
    return {
      enabled: getCleanupEnabled(),
      keepPerProject: getKeepPerProject(),
    };
  },

  async cleanupAllProjects(keepPerProject?: number) {
    const enabled = getCleanupEnabled();
    if (!enabled) {
      return {
        enabled: false,
        keepPerProject: keepPerProject ?? 0,
        projectCount: 0,
        deletedTotal: 0,
        deletedByProject: {},
      };
    }

    const keep = keepPerProject ?? getKeepPerProject();
    const keepSafe = Number.isFinite(keep) && keep > 0 ? keep : 10;

    const projects = await prisma.apifoxSyncLog.findMany({
      distinct: ["projectId"],
      select: { projectId: true },
    });

    const deletedByProject: Record<string, number> = {};
    let deletedTotal = 0;

    for (const p of projects) {
      const res = await apifoxSyncLogService.cleanupByProjectId(
        p.projectId,
        keepSafe,
      );
      if (res.deletedCount > 0) {
        deletedByProject[p.projectId] = res.deletedCount;
      }
      deletedTotal += res.deletedCount;
    }

    return {
      enabled: true,
      keepPerProject: keepSafe,
      projectCount: projects.length,
      deletedTotal,
      deletedByProject,
    };
  },

  async cleanupByProjectId(projectId: string, keepPerProject?: number) {
    const enabled = getCleanupEnabled();
    if (!enabled) {
      return { enabled: false, projectId, keepPerProject: keepPerProject ?? 0, deletedCount: 0 };
    }

    const keep = keepPerProject ?? getKeepPerProject();
    const keepSafe = Number.isFinite(keep) && keep > 0 ? keep : 10;

    const threshold = await prisma.apifoxSyncLog.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: keepSafe - 1,
      take: 1,
      select: { id: true, createdAt: true },
    });

    if (threshold.length === 0) {
      return { enabled: true, projectId, keepPerProject: keepSafe, deletedCount: 0 };
    }

    const cutoff = threshold[0];
    const deleteWhere = {
      projectId,
      OR: [
        { createdAt: { lt: cutoff.createdAt } },
        { AND: [{ createdAt: cutoff.createdAt }, { id: { lt: cutoff.id } }] },
      ],
    } as const;

    const batchSize = 500;
    const maxBatches = 20;
    let deletedCount = 0;

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
      deletedCount += res.count;

      if (candidates.length < batchSize) break;
    }

    return { enabled: true, projectId, keepPerProject: keepSafe, deletedCount };
  },
};
