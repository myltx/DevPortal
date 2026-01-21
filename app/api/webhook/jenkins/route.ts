import { NextRequest, NextResponse } from "next/server";
import { sendDingTalkMessage } from "@/lib/utils/dingtalk";

export const dynamic = "force-dynamic";

// Environment Variables (Configure these in .env)
const JENKINS_SECRET = process.env.JENKINS_WEBHOOK_SECRET;
const APIFOX_TOKEN = process.env.APIFOX_ACCESS_TOKEN;
const DINGTALK_WEBHOOK = process.env.DINGTALK_WEBHOOK_URL;
const DINGTALK_SECRET = process.env.DINGTALK_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL; // 确保已配置公网域名
const SWAGGER_EXPORT_SECRET = process.env.SWAGGER_EXPORT_SECRET; // 用于导出鉴权的密钥

// Default Import Options (match original proxy)
const DEFAULT_IMPORT_OPTIONS = {
  endpointOverwriteBehavior: "AUTO_MERGE",
  schemaOverwriteBehavior: "AUTO_MERGE",
  updateFolderOfChangedEndpoint: true,
  prependBasePath: false,
  deleteUnmatchedResources: true
};

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
    if (!PUBLIC_URL) {
        console.warn("[JenkinsWebhook] PUBLIC_URL is not configured, falling back to local merge (risky for large data)");
    }

    const exportUrl = new URL(`${PUBLIC_URL || ""}/api/tool/swagger-merge`);
    exportUrl.searchParams.set("targetUrl", targetUrl);
    if (apiPrefix) exportUrl.searchParams.set("apiPrefix", apiPrefix);
    if (timeout) exportUrl.searchParams.set("timeout", timeout);
    if (debugLimit) exportUrl.searchParams.set("debugLimit", debugLimit);
    if (SWAGGER_EXPORT_SECRET) exportUrl.searchParams.set("token", SWAGGER_EXPORT_SECRET);

    console.log(`[JenkinsWebhook] Generated export URL for Apifox: ${exportUrl.toString()}`);

    // 5. Call Apifox API (URL Mode)
    const apifoxApiUrl = `https://api.apifox.com/v1/projects/${projectId}/import-openapi`;
    
    // Construct Options
    const importOptions: any = {
      ...DEFAULT_IMPORT_OPTIONS,
    };
    if (moduleId) {
      importOptions.moduleId = parseInt(moduleId, 10);
    }
    
    // Payload uses 'URL' mode for input
    const payload = {
      input: {
        url: exportUrl.toString()
      },
      options: importOptions,
    };

    const payloadStr = JSON.stringify(payload);
    console.log(`[JenkinsWebhook] Requesting Apifox to pull from URL (Project: ${projectId})`);

    const response = await fetch(apifoxApiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${APIFOX_TOKEN}`,
            "X-Apifox-Api-Version": "2024-03-28",
            "Content-Type": "application/json"
        },
        body: payloadStr,
    });

    const responseText = await response.text();
    let result: any;
    try {
        result = JSON.parse(responseText);
    } catch (e) {
        console.error(`[JenkinsWebhook] Failed to parse Apifox response as JSON. Status: ${response.status}. Body preview: ${responseText.substring(0, 200)}...`);
        return NextResponse.json({ 
            error: "Apifox returned non-JSON response", 
            status: response.status,
            bodyPreview: responseText.substring(0, 500) 
        }, { status: 502 });
    }

    if (response.ok) {
        console.log(`[JenkinsWebhook] Successfully updated Apifox project ${projectId}`);
        
        // --- DingTalk Notification ---
        if (DINGTALK_WEBHOOK) {
            try {
                const counters = result?.data?.counters || {};
                const errors = result?.data?.errors || [];
                
                // 构建文档链接: 域名 + /api/doc.html
                let docUrl = targetUrl;
                try {
                    const urlObj = new URL(targetUrl);
                    docUrl = `${urlObj.origin}/api/doc.html`;
                } catch (e) {
                    console.warn("[JenkinsWebhook] Failed to parse targetUrl for doc link:", e);
                }

                const statsText = [
                    `**接口统计**: ✨新增 ${counters.endpointCreated || 0} | 📝更新 ${counters.endpointUpdated || 0} | ❌失败 ${counters.endpointFailed || 0} | ⏩忽略 ${counters.endpointIgnored || 0}`,
                    `**模型统计**: ✨新增 ${counters.schemaCreated || 0} | 📝更新 ${counters.schemaUpdated || 0} | ❌失败 ${counters.schemaFailed || 0} | ⏩忽略 ${counters.schemaIgnored || 0}`
                ].join("\n\n");

                let errorText = "";
                if (errors.length > 0) {
                    errorText = `\n\n> [!CAUTION]\n> **导入异常**: ${errors.map((e: any) => e.message).join("; ")}`;
                }

                await sendDingTalkMessage(DINGTALK_WEBHOOK, DINGTALK_SECRET, {
                    msgtype: "markdown",
                    markdown: {
                        title: `Apifox 同步成功`,
                        text: [
                            `### ✅ Apifox 接口自动拉取同步成功`,
                            `---`,
                            `**项目 ID**: ${projectId}`,
                            moduleId ? `**模块 ID**: ${moduleId}` : "",
                            `**接口文档**: [点击查看](${docUrl})`,
                            `---`,
                            `> **提示**: 本次同步使用 URL 模式处理，已绕过体积限制。`,
                            `---`,
                            statsText,
                            errorText,
                            `\n推送时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
                        ].filter(Boolean).join("\n\n")
                    }
                });
            } catch (notifyError: any) {
                console.error("[JenkinsWebhook] DingTalk Notification failed:", notifyError.message);
            }
        }
        // --- End DingTalk Notification ---

        return NextResponse.json({ success: true, apifoxResult: result });
    } else {
        console.error("[JenkinsWebhook] Apifox import failed:", result);
        return NextResponse.json({ error: "Apifox import failed", details: result }, { status: 502 });
    }

  } catch (error: any) {
    console.error("[JenkinsWebhook] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
