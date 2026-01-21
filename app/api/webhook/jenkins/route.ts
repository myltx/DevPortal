import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Environment Variables (Configure these in .env)
const JENKINS_SECRET = process.env.JENKINS_WEBHOOK_SECRET;
const APIFOX_TOKEN = process.env.APIFOX_ACCESS_TOKEN;

// Default Import Options (match original proxy)
const DEFAULT_IMPORT_OPTIONS = {
  endpointOverwriteBehavior: "OVERWRITE_EXISTING",
  schemaOverwriteBehavior: "OVERWRITE_EXISTING",
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

    if (!projectId) {
        return NextResponse.json({ error: "Missing required parameter: projectId (Apifox Project ID)" }, { status: 400 });
    }

    if (!APIFOX_TOKEN) {
        return NextResponse.json({ error: "Server misconfiguration: APIFOX_ACCESS_TOKEN is missing" }, { status: 500 });
    }

    // 4. Construct Callback URL (The URL Apifox will fetch from)
    // We point back to OUR /api/tool/swagger-merge endpoint
    const baseUrl = process.env.PUBLIC_URL || request.nextUrl.origin;
    const callbackUrlOb = new URL(`${baseUrl}/api/tool/swagger-merge`);
    
    if (moduleId) callbackUrlOb.searchParams.set("moduleId", moduleId);
    if (targetUrl) callbackUrlOb.searchParams.set("targetUrl", targetUrl);
    if (apiPrefix) callbackUrlOb.searchParams.set("apiPrefix", apiPrefix);
    if (debugLimit) callbackUrlOb.searchParams.set("debugLimit", debugLimit);

    const importUrl = callbackUrlOb.toString();
    console.log(`[JenkinsWebhook] Triggering Apifox import from: ${importUrl}`);

    // 5. Call Apifox API
    const apifoxApiUrl = `https://api.apifox.com/v1/projects/${projectId}/import-openapi`;
    
    // Allow overriding options via ENV
    let importOptions = DEFAULT_IMPORT_OPTIONS;
    if (process.env.APIFOX_IMPORT_OPTIONS) {
        try {
            importOptions = { ...DEFAULT_IMPORT_OPTIONS, ...JSON.parse(process.env.APIFOX_IMPORT_OPTIONS) };
        } catch (e) {
            console.warn("Failed to parse APIFOX_IMPORT_OPTIONS", e);
        }
    }

    const payload = {
      input: { url: importUrl },
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

    const result = await response.json();

    if (response.ok) {
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
