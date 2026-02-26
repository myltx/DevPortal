import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getMergedSwagger } from "@/lib/swagger-merge/fetcher";

export const dynamic = "force-dynamic";

type Payload = {
  projectId?: string;
  moduleId?: string | null;
  targetUrl?: string;
  apiPrefix?: string | null;
  timeout?: number | null;
  debugLimit?: number | null;
};

function parseNumber(input: unknown): number | undefined {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && input.trim()) {
    const parsed = Number.parseInt(input, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    const projectId = (body.projectId || "").trim();
    const targetUrl = (body.targetUrl || "").trim();
    const apiPrefix = (body.apiPrefix || "").trim();

    if (!projectId || !targetUrl) {
      return NextResponse.json(
        { success: false, error: "projectId 和 targetUrl 为必填" },
        { status: 400 },
      );
    }

    const mergedDoc = await getMergedSwagger({
      targetUrl,
      apiPrefix: apiPrefix || undefined,
      timeout: parseNumber(body.timeout),
      debugLimit: parseNumber(body.debugLimit),
    });

    if (!mergedDoc) {
      return NextResponse.json(
        { success: false, error: "拉取 merged swagger 为空" },
        { status: 400 },
      );
    }

    const specJson = JSON.stringify(mergedDoc);
    const specHash = createHash("sha256").update(specJson).digest("hex");

    const snapshot = await prisma.apifoxSpecSnapshot.upsert({
      where: { projectId },
      create: {
        projectId,
        targetUrl,
        specHash,
        specJson,
      },
      update: {
        targetUrl,
        specHash,
        specJson,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: snapshot.id,
        projectId: snapshot.projectId,
        targetUrl: snapshot.targetUrl,
        specHash: snapshot.specHash,
        updatedAt: snapshot.updatedAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
