import { NextRequest, NextResponse } from "next/server";
import { sendDingTalkMessage } from "@/lib/utils/dingtalk";

export const dynamic = "force-dynamic";

const DINGTALK_WEBHOOK = process.env.DINGTALK_WEBHOOK_URL;
const DINGTALK_SECRET = process.env.DINGTALK_SECRET;

type DiffSummary = {
  beforeTotal: number;
  afterTotal: number;
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
};

type DiffRow = {
  method: string;
  path: string;
  changedFields?: string[];
};

type Payload = {
  projectName?: string;
  summary: DiffSummary;
  added?: DiffRow[];
  removed?: DiffRow[];
  changed?: DiffRow[];
};

function formatRows(
  rows: DiffRow[],
  typeLabel: string,
  maxItems: number,
): string {
  return rows
    .slice(0, maxItems)
    .map((item) => `| ${typeLabel} | ${item.path} |`)
    .join("\n");
}

function buildDiffDetails(payload: Payload, maxItems = 10): string {
  const rows: string[] = [];
  const addedRows = payload.added || [];
  const removedRows = payload.removed || [];
  const changedRows = payload.changed || [];

  rows.push(...(formatRows(addedRows, "🟢新增", maxItems).split("\n").filter(Boolean)));
  rows.push(...(formatRows(removedRows, "🔴删除", maxItems).split("\n").filter(Boolean)));
  rows.push(...(formatRows(changedRows, "🟡修改", maxItems).split("\n").filter(Boolean)));

  if (rows.length === 0) return "";

  return [
    `| 类型 | 接口路径 |`,
    `| :---: | :--- |`,
    ...rows,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    if (!DINGTALK_WEBHOOK) {
      return NextResponse.json(
        { success: false, error: "未配置 DINGTALK_WEBHOOK_URL" },
        { status: 400 },
      );
    }

    const payload = (await request.json()) as Payload;
    if (!payload?.summary) {
      return NextResponse.json(
        { success: false, error: "缺少 summary 参数" },
        { status: 400 },
      );
    }

    const projectName = payload.projectName?.trim() || "本地模拟";
    const summary = payload.summary;
    const detailText = buildDiffDetails(payload);
    const summaryTable = [
      `| 新增 | 删除 | 修改 | 无变化 | Before 总数 | After 总数 |`,
      `| :---: | :---: | :---: | :---: | :---: | :---: |`,
      `| ${summary.added || 0} | ${summary.removed || 0} | ${summary.changed || 0} | ${summary.unchanged || 0} | ${summary.beforeTotal || 0} | ${summary.afterTotal || 0} |`,
    ].join("\n");

    await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
      msgtype: "markdown",
      markdown: {
        title: `${projectName} Diff 模拟推送`,
        text: [
          `### 🧪 ${projectName} Diff 模拟推送`,
          `---`,
          `**摘要**`,
          summaryTable,
          detailText ? `**接口变更明细（每类前 10 条）**\n${detailText}` : "",
          `\n> 说明：这是本地模拟通知，不会写快照，也不会触发 Apifox 导入。`,
          `\n发送时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
