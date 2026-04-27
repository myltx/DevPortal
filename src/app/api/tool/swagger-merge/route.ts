import { NextRequest, NextResponse } from "next/server";
import { getMergedSwagger } from "@/lib/swagger-merge/fetcher";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Extract Parameters
    const searchParams = request.nextUrl.searchParams;
    const moduleIdStr = searchParams.get("moduleId");
    let targetUrl = searchParams.get("targetUrl");
    const apiPrefix = searchParams.get("apiPrefix") || undefined;
    const timeoutStr = searchParams.get("timeout");
    const debugLimitStr = searchParams.get("debugLimit");

    // 2. Resolve Module ID if present (Managed Mode)
    if (moduleIdStr) {
        const moduleId = parseInt(moduleIdStr, 10);
        if (!isNaN(moduleId)) {
            const module = await prisma.module.findUnique({
                where: { id: moduleId }
            });
            
            if (module && module.moduleUrl) {
                // Only use DB url if targetUrl wasn't explicitly provided (Hybrid Fallback)
                if (!targetUrl) {
                    targetUrl = module.moduleUrl;
                }
            } else {
                if (!targetUrl) {
                   return NextResponse.json({ error: "Module not found or missing moduleUrl" }, { status: 404 }); 
                }
            }
        }
    }
    
    if (!targetUrl) {
        return NextResponse.json({ 
            error: "Missing required parameter: targetUrl (or valid moduleId)" 
        }, { status: 400 });
    }
    
    // 3. Execute Merge
    const mergedDocs = await getMergedSwagger({
        targetUrl,
        apiPrefix,
        timeout: timeoutStr ? parseInt(timeoutStr, 10) : undefined,
        debugLimit: debugLimitStr ? parseInt(debugLimitStr, 10) : undefined
    });
    
    return NextResponse.json(mergedDocs);
    
  } catch (error: any) {
    console.error("[SwaggerProxy] Error:", error.message);
    return NextResponse.json({ 
        error: "Failed to process swagger merge",
        details: error.message 
    }, { status: 500 });
  }
}
