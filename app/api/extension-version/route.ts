import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // No caching

export async function GET() {
  return NextResponse.json({
    version: "1.0", // 修改此处以发布新版本
    downloadUrl: "", // 可选：配置内网下载地址
    forceUpdate: false, // 可选：是否强制更新
  });
}
