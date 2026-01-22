import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
  }

  try {
    // 限制只能读取 docs 目录下的 md 文件，防止路径穿越攻击
    const safeFile = path.basename(file);
    
    // Special Mapping: Read extension manual directly from source
    let filePath;
    if (safeFile === "extension.md") {
      filePath = path.join(process.cwd(), "chrome-extension", "README.md");
    } else {
      filePath = path.join(process.cwd(), "docs", safeFile);
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
