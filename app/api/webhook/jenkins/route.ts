import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { sendDingTalkMessage } from "@/lib/utils/dingtalk";
import { prisma } from "@/lib/prisma";
import { apifoxSyncLogService } from "@/services/apifoxSyncLogService";
import { getMergedSwagger } from "@/lib/swagger-merge/fetcher";
import { diffSwaggerDocs, type SwaggerDiffResult } from "@/lib/swagger-diff";

export const dynamic = "force-dynamic";

// Environment Variables (Configure these in .env)
const JENKINS_SECRET = process.env.JENKINS_WEBHOOK_SECRET;
const APIFOX_TOKEN = process.env.APIFOX_ACCESS_TOKEN;
const DINGTALK_WEBHOOK = process.env.DINGTALK_WEBHOOK_URL;
const DINGTALK_SECRET = process.env.DINGTALK_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL; // 确保已配置公网域名
const SWAGGER_EXPORT_SECRET = process.env.SWAGGER_EXPORT_SECRET; // 用于导出鉴权的密钥

interface ApifoxImportResult {
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    error?: { message: string };
    data?: {
        counters?: {
            endpointCreated?: number;
            endpointUpdated?: number;
            endpointFailed?: number;
            endpointIgnored?: number;
            schemaCreated?: number;
            schemaUpdated?: number;
            schemaFailed?: number;
            schemaIgnored?: number;
        };
        errors?: Array<{ message: string }>;
    };
}

interface DiffContext {
    result?: SwaggerDiffResult;
    baseline: boolean;
    failed: boolean;
    errorMessage?: string;
    specJson?: string;
    specHash?: string;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

function parseIntSafe(input?: string | null): number | undefined {
    if (!input) return undefined;
    const parsed = parseInt(input, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function buildDiffSummaryMarkdown(diff?: SwaggerDiffResult): string {
    if (!diff) return "";
    return [
        `| Diff 项 | 数量 |`,
        `| :--- | :--- |`,
        `| 新增 | ${diff.summary.added} |`,
        `| 删除 | ${diff.summary.removed} |`,
        `| 修改 | ${diff.summary.changed} |`,
        `| 无变化 | ${diff.summary.unchanged} |`
    ].join("\n");
}

function buildDiffDetailsMarkdown(diff?: SwaggerDiffResult, maxItems = 20): string {
    if (!diff) return "";
    const lines: string[] = [];

    diff.added.slice(0, maxItems).forEach((item) => {
        lines.push(`+ ${item.method} ${item.path}`);
    });
    diff.removed.slice(0, maxItems).forEach((item) => {
        lines.push(`- ${item.method} ${item.path}`);
    });
    diff.changed.slice(0, maxItems).forEach((item) => {
        lines.push(`~ ${item.method} ${item.path} (${item.changedFields.join(", ")})`);
    });

    if (lines.length === 0) return "";
    return ["**接口变更明细（最多展示前 20 条）**", ...lines].join("\n");
}

async function buildDiffContext(params: {
    projectId: string;
    moduleId?: string | null;
    targetUrl: string;
    apiPrefix?: string | null;
    debugLimit?: string | null;
    timeout?: string | null;
}): Promise<DiffContext> {
    const { projectId, moduleId, targetUrl, apiPrefix, debugLimit, timeout } = params;
    const moduleKey = moduleId || "";
    const apiPrefixKey = apiPrefix || "";
    const where = {
        projectId_moduleKey_targetUrl_apiPrefix: {
            projectId,
            moduleKey,
            targetUrl,
            apiPrefix: apiPrefixKey,
        },
    } as const;

    try {
        const mergedDoc = await getMergedSwagger({
            targetUrl,
            apiPrefix: apiPrefix || undefined,
            timeout: parseIntSafe(timeout),
            debugLimit: parseIntSafe(debugLimit),
        });

        if (!mergedDoc) {
            return {
                baseline: false,
                failed: true,
                errorMessage: "Merged Swagger 为空，无法执行 diff",
            };
        }

        const specJson = JSON.stringify(mergedDoc);
        const specHash = createHash("sha256").update(specJson).digest("hex");
        const snapshot = await prisma.apifoxSpecSnapshot.findUnique({ where });

        if (!snapshot) {
            return {
                baseline: true,
                failed: false,
                specJson,
                specHash,
            };
        }

        try {
            const beforeDoc = JSON.parse(snapshot.specJson);
            const result = diffSwaggerDocs(beforeDoc, mergedDoc);
            return {
                baseline: false,
                failed: false,
                result,
                specJson,
                specHash,
            };
        } catch (error: unknown) {
            return {
                baseline: false,
                failed: true,
                errorMessage: `快照解析失败: ${getErrorMessage(error)}`,
                specJson,
                specHash,
            };
        }
    } catch (error: unknown) {
        return {
            baseline: false,
            failed: true,
            errorMessage: `拉取 merged JSON 失败: ${getErrorMessage(error)}`,
        };
    }
}


/**
 * 核心同步任务（后台异步执行）
 */
async function performApifoxSync(params: {
    projectId: string;
    moduleId?: string | null;
    targetUrl: string;
    apiPrefix?: string | null;
    debugLimit?: string | null;
    timeout?: string | null;
    customProjectName?: string | null;
    fullExportUrl: string;
    apifoxApiUrl: string;
    importOptions: Record<string, unknown>;
}) {
    const { 
        projectId, moduleId, targetUrl, apiPrefix, 
        debugLimit, timeout, customProjectName, 
        fullExportUrl, apifoxApiUrl, importOptions 
    } = params;

    console.log(`[ApifoxSyncTask] Starting background sync for project ${projectId} (${customProjectName || "N/A"})`);
    
    const diffContext = await buildDiffContext({
        projectId,
        moduleId,
        targetUrl,
        apiPrefix,
        debugLimit,
        timeout,
    });

    try {
        const payload = {
            input: { url: fullExportUrl },
            options: importOptions,
        };

        const response = await fetch(apifoxApiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${APIFOX_TOKEN}`,
                "X-Apifox-Api-Version": "2024-03-28",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let result: ApifoxImportResult;
        
        try {
            result = JSON.parse(responseText);
        } catch {
            const errorMsg = `Failed to parse Apifox response as JSON. Status: ${response.status}`;
            console.error(`[ApifoxSyncTask] ${errorMsg}. Body preview: ${responseText.substring(0, 200)}...`);
            
            await prisma.apifoxSyncLog.create({
                data: {
                    projectId,
                    projectName: customProjectName,
                    status: "FAILURE",
                    errorMessage: errorMsg,
                    rawResponse: responseText
                }
            });
            await apifoxSyncLogService.cleanupByProjectId(projectId);

            if (DINGTALK_WEBHOOK) {
                await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
                    msgtype: "markdown",
                    markdown: {
                        title: `Apifox 同步异常`,
                        text: `### ❌ Apifox 同步返回异常\n---\n**项目**: ${customProjectName || projectId}\n**HTTP 状态码**: ${response.status}\n\n**响应预览**: ${responseText.substring(0, 200)}...`
                    }
                });
            }
            return;
        }

        if (response.ok) {
            console.log(`[ApifoxSyncTask] Successfully updated Apifox project ${projectId}`);
            const stats = result?.data?.counters || {};

            if (diffContext.specJson && diffContext.specHash) {
                const moduleKey = moduleId || "";
                const apiPrefixKey = apiPrefix || "";
                await prisma.apifoxSpecSnapshot.upsert({
                    where: {
                        projectId_moduleKey_targetUrl_apiPrefix: {
                            projectId,
                            moduleKey,
                            targetUrl,
                            apiPrefix: apiPrefixKey,
                        },
                    },
                    create: {
                        projectId,
                        moduleKey,
                        targetUrl,
                        apiPrefix: apiPrefixKey,
                        specHash: diffContext.specHash,
                        specJson: diffContext.specJson,
                    },
                    update: {
                        specHash: diffContext.specHash,
                        specJson: diffContext.specJson,
                    },
                });
            }
            
            await prisma.apifoxSyncLog.create({
                data: {
                    projectId,
                    projectName: customProjectName,
                    status: "SUCCESS",
                    endpointCreated: stats.endpointCreated || 0,
                    endpointUpdated: stats.endpointUpdated || 0,
                    endpointIgnored: stats.endpointIgnored || 0,
                    schemaCreated: stats.schemaCreated || 0,
                    schemaUpdated: stats.schemaUpdated || 0,
                    rawResponse: JSON.stringify(result)
                }
            });
            await apifoxSyncLogService.cleanupByProjectId(projectId);

            if (DINGTALK_WEBHOOK) {
                try {
                    const stats = result?.data?.counters || {};
                    const errors = result?.data?.errors || [];
                    let docUrl = targetUrl || "";
                    try { if (targetUrl) { const urlObj = new URL(targetUrl); docUrl = `${urlObj.origin}/api/doc.html`; } } catch { /* Ignore */ }

                    const tableStats = [
                        `| 类型 | 新增 | 修改 | 无变化 |`,
                        `| :--- | :--- | :--- | :--- |`,
                        `| 接口/文档 | ${stats.endpointCreated || 0} | ${stats.endpointUpdated || 0} | ${stats.endpointIgnored || 0} |`,
                        `| 数据模型 | ${stats.schemaCreated || 0} | ${stats.schemaUpdated || 0} | ${stats.schemaIgnored || 0} |`
                    ].join("\n");

                    let errorText = "";
                    if (errors.length > 0) {
                        errorText = `\n\n> [!CAUTION]\n> **导入异常**: ${errors.map((e) => e.message).join("; ")}`;
                    }

                    let diffSection = "";
                    if (diffContext.failed) {
                        diffSection = `> **Diff 明细生成失败**: ${diffContext.errorMessage || "未知错误（已降级为统计结果）"}`;
                    } else if (diffContext.baseline) {
                        diffSection = `> **Diff 状态**: 首次基线导入，已记录快照，下次开始输出接口差异。`;
                    } else {
                        const diffSummary = buildDiffSummaryMarkdown(diffContext.result);
                        const diffDetails = buildDiffDetailsMarkdown(diffContext.result);
                        diffSection = [diffSummary, diffDetails].filter(Boolean).join("\n\n");
                    }

                    await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
                        msgtype: "markdown",
                        markdown: {
                            title: `${customProjectName || "Apifox"} 同步成功`,
                            text: [
                                `### ✅ ${customProjectName || "Apifox"} 接口同步成功`,
                                `---`,
                                `**项目 ID**: ${projectId}`,
                                moduleId ? `**模块 ID**: ${moduleId}` : "",
                                `**接口文档**: [点击查看](${docUrl})`,
                                `\n`,
                                tableStats,
                                diffSection ? `\n` : "",
                                diffSection,
                                errorText,
                                `\n**策略**: 智能合并 (Smart Merge)`,
                                `\n**推送时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                            ].filter(Boolean).join("\n")
                        }
                    });
                } catch (error: unknown) { console.error("[ApifoxSyncTask] DingTalk Notify Error:", getErrorMessage(error)); }
            }
        } else {
            console.error("[ApifoxSyncTask] Apifox import failed:", result);
            await prisma.apifoxSyncLog.create({
                data: {
                    projectId,
                    projectName: customProjectName,
                    status: "FAILURE",
                    errorMessage: result?.errorMessage || result?.error?.message || "未知错误",
                    rawResponse: JSON.stringify(result)
                }
            });
            await apifoxSyncLogService.cleanupByProjectId(projectId);

            if (DINGTALK_WEBHOOK) {
                await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
                    msgtype: "markdown",
                    markdown: {
                        title: `${customProjectName || "Apifox"} 同步失败`,
                        text: [
                            `### ❌ ${customProjectName || "Apifox"} 接口同步失败`,
                            `---`,
                            `**项目 ID**: ${projectId}`,
                            `**错误信息**: ${result?.errorMessage || result?.error?.message || "未知错误"}`,
                            `**错误代码**: ${result?.errorCode || "N/A"}`,
                            `---`,
                            `> **排查建议**: 请检查 PUBLIC_URL 是否连通，以及 SWAGGER_EXPORT_SECRET 是否匹配。`,
                            `\n检测时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                        ].join("\n\n")
                    }
                });
            }
        }
    } catch (error: unknown) {
        console.error("[ApifoxSyncTask] Fatal Error:", getErrorMessage(error));
        try {
            await prisma.apifoxSyncLog.create({
                data: {
                    projectId,
                    projectName: customProjectName,
                    status: "FAILURE",
                    errorMessage: `Fatal error: ${getErrorMessage(error)}`
                }
            });
        } catch {}
    }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth Check
    const token = request.headers.get("x-jenkins-token");
    if (JENKINS_SECRET && token !== JENKINS_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Status Check
    const body = await request.json();
    if (body.status !== "SUCCESS") {
        return NextResponse.json({ message: "Ignored non-success status" });
    }

    // 3. Extract Params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId"); 
    const moduleId = searchParams.get("moduleId");
    const targetUrl = searchParams.get("targetUrl");
    const apiPrefix = searchParams.get("apiPrefix");
    const debugLimit = searchParams.get("debugLimit");
    const timeout = searchParams.get("timeout");
    const customProjectName = searchParams.get("projectName"); 

    if (!projectId || !targetUrl) {
        return NextResponse.json({ error: "Missing required parameters: projectId and targetUrl" }, { status: 400 });
    }

    if (!APIFOX_TOKEN) {
        return NextResponse.json({ error: "Server misconfiguration: APIFOX_ACCESS_TOKEN is missing" }, { status: 500 });
    }

    // 4. Construct Public Export URL
    const cleanPublicUrl = (PUBLIC_URL || "").replace(/\/$/, "");
    const exportUrl = new URL(`${cleanPublicUrl}/api/swagger/public-export`);
    exportUrl.searchParams.set("targetUrl", targetUrl);
    if (apiPrefix) exportUrl.searchParams.set("apiPrefix", apiPrefix);
    if (timeout) exportUrl.searchParams.set("timeout", timeout);
    if (debugLimit) exportUrl.searchParams.set("debugLimit", debugLimit);
    if (SWAGGER_EXPORT_SECRET) exportUrl.searchParams.set("token", SWAGGER_EXPORT_SECRET);

    const fullExportUrl = exportUrl.toString();
    console.log(`[JenkinsWebhook] Generated export URL: ${fullExportUrl}`);

    // 5. Call Apifox API (Async)
    const apifoxApiUrl = `https://api.apifox.com/v1/projects/${projectId}/import-openapi`;
    const importOptions = {
        endpointOverwriteBehavior: "AUTO_MERGE",
        schemaOverwriteBehavior: "AUTO_MERGE",
        updateFolderOfChangedEndpoint: true,
        deleteUnmatchedResources: true,
        prependBasePath: false,
        importMode: "incrementalUpdate",
        ...(moduleId ? { moduleId: parseInt(moduleId, 10) } : {})
    };

    // 🚀 Fire and Forget
    performApifoxSync({
        projectId, moduleId, targetUrl, apiPrefix,
        debugLimit, timeout, customProjectName,
        fullExportUrl, apifoxApiUrl, importOptions
    }).catch(e => console.error("[JenkinsWebhook] Async task crash:", e.message));

    return NextResponse.json({ 
        success: true, 
        message: "Sync task started in background",
        projectId: projectId
    }, { status: 202 });

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error("[JenkinsWebhook] Request Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
