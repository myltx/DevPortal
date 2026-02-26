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

function buildDiffDetails(payload: Payload, maxItems = 20): string {
  const lines: string[] = [];
  (payload.added || []).slice(0, maxItems).forEach((item) => {
    lines.push(`+ ${item.method} ${item.path}`);
  });
  (payload.removed || []).slice(0, maxItems).forEach((item) => {
    lines.push(`- ${item.method} ${item.path}`);
  });
  (payload.changed || []).slice(0, maxItems).forEach((item) => {
    const fields =
      Array.isArray(item.changedFields) && item.changedFields.length > 0
        ? ` (${item.changedFields.join(", ")})`
        : "";
    lines.push(`~ ${item.method} ${item.path}${fields}`);
  });
  return lines.join("\n");
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

    const table = [
      `| Diff 项 | 数量 |`,
      `| :--- | :--- |`,
      `| 新增 | ${summary.added || 0} |`,
      `| 删除 | ${summary.removed || 0} |`,
      `| 修改 | ${summary.changed || 0} |`,
      `| 无变化 | ${summary.unchanged || 0} |`,
      `| Before 总数 | ${summary.beforeTotal || 0} |`,
      `| After 总数 | ${summary.afterTotal || 0} |`,
    ].join("\n");

    await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
      msgtype: "markdown",
      markdown: {
        title: `${projectName} Diff 模拟推送`,
        text: [
          `### 🧪 ${projectName} Diff 模拟推送`,
          `---`,
          table,
          detailText ? `\n**接口变更明细（最多展示前 20 条）**\n${detailText}` : "",
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
