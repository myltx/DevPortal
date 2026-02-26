import { NextRequest, NextResponse } from "next/server";
import { diffSwaggerDocs } from "@/lib/swagger-diff";

export const dynamic = "force-dynamic";

type Payload = {
  before: unknown;
  after: unknown;
};

function parseDoc(value: unknown) {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    return JSON.parse(value) as Record<string, unknown>;
  }
  throw new Error("JSON 内容为空或格式错误");
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Payload;
    const beforeDoc = parseDoc(payload?.before);
    const afterDoc = parseDoc(payload?.after);
    const result = diffSwaggerDocs(beforeDoc, afterDoc);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Diff 失败";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
