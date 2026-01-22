import { NextRequest, NextResponse } from "next/server";
import { sendDingTalkMessage } from "@/lib/utils/dingtalk";
import { prisma } from "@/lib/prisma";

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
    const projectId = searchParams.get("projectId"); // Apifox Project ID
    const moduleId = searchParams.get("moduleId");
    const targetUrl = searchParams.get("targetUrl");
    const apiPrefix = searchParams.get("apiPrefix");
    const debugLimit = searchParams.get("debugLimit");
    const timeout = searchParams.get("timeout");
    const customProjectName = searchParams.get("projectName"); // 新增：项目中文名称

    if (!projectId) {
        return NextResponse.json({ error: "Missing required parameter: projectId" }, { status: 400 });
    }

    if (!APIFOX_TOKEN) {
        return NextResponse.json({ error: "Server misconfiguration: APIFOX_ACCESS_TOKEN is missing" }, { status: 500 });
    }

    if (!targetUrl) {
        return NextResponse.json({ error: "Missing required parameter: targetUrl" }, { status: 400 });
    }

    // 4. Construct Public Export URL
    // 我们不再在本地进行合并和发送，而是生成一个公网可访问的 URL 让 Apifox 来拉取。
    // 这解决了 4.7MB 超大负载导致的同步失败问题。
    const cleanPublicUrl = (PUBLIC_URL || "").replace(/\/$/, "");
    if (!cleanPublicUrl) {
        console.warn("[JenkinsWebhook] PUBLIC_URL is not configured, API import may fail if Apifox cannot reach this server.");
    }

    const exportUrl = new URL(`${cleanPublicUrl}/api/swagger/public-export`);
    exportUrl.searchParams.set("targetUrl", targetUrl);
    if (apiPrefix) exportUrl.searchParams.set("apiPrefix", apiPrefix);
    if (timeout) exportUrl.searchParams.set("timeout", timeout);
    if (debugLimit) exportUrl.searchParams.set("debugLimit", debugLimit);
    if (SWAGGER_EXPORT_SECRET) exportUrl.searchParams.set("token", SWAGGER_EXPORT_SECRET);

    const fullExportUrl = exportUrl.toString();
    console.log(`[JenkinsWebhook] Generated export URL for Apifox: ${fullExportUrl}`);

    // 5. Call Apifox API (URL Mode)
    const apifoxApiUrl = `https://api.apifox.com/v1/projects/${projectId}/import-openapi`;
    
    // Construct Options (Aligned with User Screenshot)
    const importOptions: any = {
      endpointOverwriteBehavior: "AUTO_MERGE", // 匹配截图：智能合并
      schemaOverwriteBehavior: "AUTO_MERGE",   // 匹配截图：智能合并
      updateFolderOfChangedEndpoint: true,   // 匹配截图：更新接口所在目录
      deleteUnmatchedResources: true,        // 匹配截图：删除不在数据源中的资源
      prependBasePath: false,                // 匹配截图：接口路径加上 basePath (未开启)
      importMode: "incrementalUpdate",       // 强制增量更新
    };
    if (moduleId) {
      importOptions.moduleId = parseInt(moduleId, 10);
    }
    
    // Payload uses 'URL' mode for input
    const payload = {
      input: {
        url: fullExportUrl
      },
      options: importOptions,
    };

    console.log(`[JenkinsWebhook] Requesting Apifox to pull from URL. Options:`, JSON.stringify(importOptions));

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
        console.error(`[JenkinsWebhook] ${errorMsg}. Body preview: ${responseText.substring(0, 200)}...`);
        
        // Log to database even on parse error
        await prisma.apifoxSyncLog.create({
            data: {
                projectId: projectId,
                projectName: customProjectName,
                status: "FAILURE",
                errorMessage: errorMsg,
                rawResponse: responseText
            }
        });

        if (DINGTALK_WEBHOOK) {
            await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
                msgtype: "markdown",
                markdown: {
                    title: `Apifox 同步异常`,
                    text: `### ❌ Apifox 同步返回异常\n---\n**HTTP 状态码**: ${response.status}\n\n**响应预览**: ${responseText.substring(0, 200)}...`
                }
            });
        }
        return NextResponse.json({ 
            error: "Apifox returned non-JSON response", 
            status: response.status,
            bodyPreview: responseText.substring(0, 500) 
        }, { status: 502 });
    }

    if (response.ok) {
        console.log(`[JenkinsWebhook] Successfully updated Apifox project ${projectId}`);
        
        const stats = result?.data?.counters || {};
        
        // Log success to database
        await prisma.apifoxSyncLog.create({
            data: {
                projectId: projectId,
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

        // --- Success Notification ---
        if (DINGTALK_WEBHOOK) {
            try {
                const stats = result?.data?.counters || {};
                const errors = result?.data?.errors || [];
                
                let docUrl = targetUrl || "";
                try {
                    if (targetUrl) {
                        const urlObj = new URL(targetUrl);
                        docUrl = `${urlObj.origin}/api/doc.html`;
                    }
                } catch { /* Ignore */ }

                // Improved Markdown Table Layout
                const tableStats = [
                    `| 类型 | 新增 | 修改 | 无变化 |`,
                    `| :--- | :--- | :--- | :--- |`,
                    `| 接口/文档 | ${stats.endpointCreated || 0} | ${stats.endpointUpdated || 0} | ${stats.endpointIgnored || 0} |`,
                    `| 数据模型 | ${stats.schemaCreated || 0} | ${stats.schemaUpdated || 0} | ${stats.schemaIgnored || 0} |`
                ].join("\n");

                let errorText = "";
                if (errors.length > 0) {
                    errorText = `\n\n> [!CAUTION]\n> **导入异常**: ${errors.map((e: any) => e.message).join("; ")}`;
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
                            errorText,
                            `\n**策略**: 智能合并 (Smart Merge)`,
                            `\n**说明**: 自动同步包含结构标准化 (如排序)，可能导致"修改"计数增加。`,
                            `\n**推送时间**: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                        ].filter(Boolean).join("\n")
                    }
                });
            } catch (notifyError: any) {
                console.error("[JenkinsWebhook] DingTalk Notification failed:", notifyError.message);
            }
        }

        return NextResponse.json({ success: true, apifoxResult: result });
    } else {

        console.error("[JenkinsWebhook] Apifox import failed:", result);
        
        // Log failure to database
        await prisma.apifoxSyncLog.create({
            data: {
                projectId: projectId,
                projectName: customProjectName,
                status: "FAILURE",
                errorMessage: result?.errorMessage || result?.error?.message || "未知错误",
                rawResponse: JSON.stringify(result)
            }
        });

        // --- Failure Notification ---
        if (DINGTALK_WEBHOOK) {
            try {
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
            } catch (notifyError: any) {
                console.error("[JenkinsWebhook] DingTalk Failure Notification failed:", notifyError.message);
            }
        }
        
        return NextResponse.json({ error: "Apifox import failed", details: result }, { status: 502 });
    }

  } catch (error: any) {
    console.error("[JenkinsWebhook] Error:", error.message);
    // Attempt local error logging if possible
    try {
        // We might not have projectId here if error happened early
        if (request.nextUrl.searchParams.get("projectId")) {
             await prisma.apifoxSyncLog.create({
                data: {
                    projectId: request.nextUrl.searchParams.get("projectId") || "unknown",
                    projectName: request.nextUrl.searchParams.get("projectName") || "unknown",
                    status: "FAILURE",
                    errorMessage: error.message
                }
            });
        }
    } catch {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
