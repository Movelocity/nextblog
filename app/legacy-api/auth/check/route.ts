import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/jwt";
import { extractTokenFromHeader } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token);

    return NextResponse.json({
      valid: true,
      user: {
        email: payload.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid token",
      },
      { status: 401 }
    );
  }
}
