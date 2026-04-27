import { NextRequest, NextResponse } from "next/server";
import { getMergedSwagger } from "@/lib/swagger-merge/fetcher";

export const dynamic = "force-dynamic";

/**
 * 公网安全导出接口 (代理模式)
 * 映射此接口到公网，提供带 Token 鉴权的 Swagger 合并导出功能。
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 1. 鉴权校验
    const token = searchParams.get("token");
    const exportSecret = process.env.SWAGGER_EXPORT_SECRET;
    
    // 必须配置密钥且 Token 匹配。如果没配置密钥，默认拒绝所有公网导出请求以保安全。
    if (!exportSecret || token !== exportSecret) {
      console.warn("[PublicExport] Unauthorized access attempt or missing SWAGGER_EXPORT_SECRET");
      return NextResponse.json({ error: "Unauthorized: Invalid or missing token" }, { status: 403 });
    }

    // 2. 参数提取
    const targetUrl = searchParams.get("targetUrl");
    const apiPrefix = searchParams.get("apiPrefix") || undefined;
    const timeoutStr = searchParams.get("timeout");
    const debugLimitStr = searchParams.get("debugLimit");
    
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing required parameter: targetUrl" }, { status: 400 });
    }
    
    // 3. 执行合并导出
    const mergedDocs = await getMergedSwagger({
      targetUrl,
      apiPrefix,
      timeout: timeoutStr ? parseInt(timeoutStr, 10) : undefined,
      debugLimit: debugLimitStr ? parseInt(debugLimitStr, 10) : undefined
    });
    
    return NextResponse.json(mergedDocs);
    
  } catch (error: any) {
    console.error("[PublicExport] Error:", error.message);
    return NextResponse.json({ 
      error: "Failed to process swagger merge",
      details: error.message 
    }, { status: 500 });
  }
}
