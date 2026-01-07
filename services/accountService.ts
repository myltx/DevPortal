import { prisma } from "@/lib/prisma";
import { AccountDTO, AccountListDTO, AccountListVO } from "@/types";

export const accountService = {
  accountList: async (dto: AccountListDTO): Promise<AccountListVO[]> => {
    const accounts = await prisma.account.findMany({
      where: {
        moduleId: dto.moduleId,
      },
    });
    return accounts.map(a => ({
      id: a.id,
      account: a.account || "",
      password: a.password || "",
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
};
