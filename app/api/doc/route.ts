import { NextResponse } from "next/server";
import spec from "../../../public/openapi.json";

export async function GET() {
  return NextResponse.json(spec);
}
