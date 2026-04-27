import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveDocRoute } from "@/lib/docs-manifest";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
  }

  try {
    const resolvedRoute = resolveDocRoute(file).replace(/^\/+/, "");
    const normalizedRoute = path.posix.normalize(resolvedRoute);

    if (
      !normalizedRoute ||
      normalizedRoute.startsWith("../") ||
      normalizedRoute.includes("\0")
    ) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const docsRoot = path.resolve(process.cwd(), "docs");
    const filePath = path.resolve(docsRoot, normalizedRoute);

    if (filePath !== docsRoot && !filePath.startsWith(`${docsRoot}${path.sep}`)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
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
