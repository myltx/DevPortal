import { NextRequest, NextResponse } from "next/server";
import { getMergedSwagger } from "@/lib/swagger-merge/fetcher";
import { sendDingTalkMessage } from "@/lib/utils/dingtalk";

export const dynamic = "force-dynamic";

// Environment Variables (Configure these in .env)
const JENKINS_SECRET = process.env.JENKINS_WEBHOOK_SECRET;
const APIFOX_TOKEN = process.env.APIFOX_ACCESS_TOKEN;
const DINGTALK_WEBHOOK = process.env.DINGTALK_WEBHOOK_URL;
const DINGTALK_SECRET = process.env.DINGTALK_SECRET;

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

    // 4. Fetch Swagger Locally (Support Local Debugging / Private Network)
    // We fetch the merged swagger data on OUR server instead of letting Apifox cloud fetch it.
    // This solves the 'Apifox Cloud cannot access Localhost' problem.
    console.log(`[JenkinsWebhook] Merging swagger locally for target: ${targetUrl}`);
    const mergedDocs = await getMergedSwagger({
        targetUrl,
        apiPrefix: apiPrefix || undefined,
        timeout: timeout ? parseInt(timeout, 10) : undefined,
        debugLimit: debugLimit ? parseInt(debugLimit, 10) : undefined
    });

    if (!mergedDocs) {
        return NextResponse.json({ error: "Failed to fetch or merge swagger data locally" }, { status: 500 });
    }

    // 5. Call Apifox API (Push Mode)
    const apifoxApiUrl = `https://api.apifox.com/v1/projects/${projectId}/import-openapi`;
    
    // Construct Options
    const importOptions: any = {
      ...DEFAULT_IMPORT_OPTIONS,
    };
    if (moduleId) {
      importOptions.moduleId = parseInt(moduleId, 10);
    }
    if (process.env.APIFOX_IMPORT_OPTIONS) {
      try {
        const envOptions = JSON.parse(process.env.APIFOX_IMPORT_OPTIONS);
        Object.assign(importOptions, envOptions);
      } catch (e) {
        console.warn("Failed to parse APIFOX_IMPORT_OPTIONS", e);
      }
    }

    // Payload uses 'String' mode for input
    const payload = {
      input: JSON.stringify(mergedDocs), // Send the content directly!
      options: importOptions,
    };

    console.log(`[JenkinsWebhook] Pushing merged data to Apifox project ${projectId} (Push Mode)`);

    const response = await fetch(apifoxApiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${APIFOX_TOKEN}`,
            "X-Apifox-Api-Version": "2024-03-28",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
        console.log(`[JenkinsWebhook] Successfully updated Apifox project ${projectId}`);
        
        // --- DingTalk Notification ---
        if (DINGTALK_WEBHOOK) {
            try {
                const counters = result?.data?.counters || {};
                const errors = result?.data?.errors || [];
                
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
                        title: "Apifox 接口同步成功",
                        text: [
                            `### ✅ Apifox 接口自动合并推送成功`,
                            `---`,
                            `**项目 ID**: ${projectId}`,
                            moduleId ? `**模块 ID**: ${moduleId}` : "",
                            `**源地址**: [Swagger JSON](${targetUrl})`,
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
