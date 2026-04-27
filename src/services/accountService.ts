import { prisma } from "@/lib/prisma";
import { AccountDTO, AccountListDTO, AccountListVO } from "@/types";

export const accountService = {
  accountList: async (dto: AccountListDTO): Promise<AccountListVO[]> => {
    if (!dto.moduleId) {
      return [];
    }
    const accounts = await prisma.account.findMany({
      where: {
        moduleId: dto.moduleId,
      },
    });
    return accounts.map(a => ({
      id: a.id,
      account: a.account || "",
      password: a.password || "",
      accountInfo: a.accountInfo || "",
      remark: a.remark || "",
    }));
  },

  addOrUpdate: async (dto: AccountDTO): Promise<boolean> => {
    if (dto.id) {
      // Update
      await prisma.account.update({
        where: { id: dto.id },
        data: {
            account: dto.account,
            password: dto.password,
            accountInfo: dto.accountInfo,
            remark: dto.remark,
            moduleId: dto.moduleId
        }
      });
    } else {
      // Add
      await prisma.account.create({
          data: {
              account: dto.account,
              password: dto.password,
              accountInfo: dto.accountInfo,
              remark: dto.remark,
              moduleId: dto.moduleId
          }
      });
    }
    return true;
  },

  deleteAccount: async (ids: number[]): Promise<number> => {
    const result = await prisma.account.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    return result.count;
  },

  batchImport: async (dto: {
    moduleId: number;
    items: Array<{
      account: string;
      password: string;
      accountInfo?: string;
      remark?: string;
    }>;
  }): Promise<{
    total: number;
    invalid: number;
    deduped: number;
    created: number;
    skippedExisting: number;
  }> => {
    const moduleId = Number(dto.moduleId);
    const items = Array.isArray(dto.items) ? dto.items : [];
    if (!moduleId || !Number.isFinite(moduleId)) {
      return { total: items.length, invalid: items.length, deduped: 0, created: 0, skippedExisting: 0 };
    }

    const total = items.length;
    const normalized = items
      .map((i) => ({
        account: String(i.account || "").trim(),
        password: String(i.password || "").trim(),
        accountInfo: i.accountInfo != null ? String(i.accountInfo).trim() : undefined,
        remark: i.remark != null ? String(i.remark).trim() : undefined,
      }))
      .filter((i) => i.account && i.password);

    const invalid = total - normalized.length;

    const uniqMap = new Map<string, typeof normalized[number]>();
    for (const i of normalized) {
      const key = `${i.account}\u0000${i.password}`;
      if (!uniqMap.has(key)) uniqMap.set(key, i);
    }
    const dedupedItems = Array.from(uniqMap.values());

    const existing = await prisma.account.findMany({
      where: {
        moduleId,
        account: { in: dedupedItems.map((x) => x.account) },
      },
      select: { account: true, password: true },
    });

    const existingSet = new Set(existing.map((e) => `${e.account || ""}\u0000${e.password || ""}`));

    const toCreate = dedupedItems.filter((i) => !existingSet.has(`${i.account}\u0000${i.password}`));
    const skippedExisting = dedupedItems.length - toCreate.length;

    if (toCreate.length === 0) {
      return { total, invalid, deduped: dedupedItems.length, created: 0, skippedExisting };
    }

    const result = await prisma.account.createMany({
      data: toCreate.map((i) => ({
        moduleId,
        account: i.account,
        password: i.password,
        accountInfo: i.accountInfo || null,
        remark: i.remark || null,
      })),
    });

    return {
      total,
      invalid,
      deduped: dedupedItems.length,
      created: result.count,
      skippedExisting,
    };
  },
};
