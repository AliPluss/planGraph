import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return new NextResponse("Forbidden: PlanGraph is localhost-only", {
      status: 403,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
