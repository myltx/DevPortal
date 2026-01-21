import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    jenkinsSecret: process.env.JENKINS_WEBHOOK_SECRET || "",
    publicUrl: process.env.PUBLIC_URL || "",
  });
}
