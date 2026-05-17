import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    value?: unknown[];
  } | null;

  return NextResponse.json({
    received: true,
    events: payload?.value?.length ?? 0,
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const validationToken = url.searchParams.get("validationToken");

  if (validationToken) {
    return new Response(validationToken, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json({
    status: "ok",
  });
}
