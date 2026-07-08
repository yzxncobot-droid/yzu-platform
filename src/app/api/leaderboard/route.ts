import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "ALL_TIME";

    const leaderboard = await prisma.topupLeaderboard.findMany({
      where: { period },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
      orderBy: { rank: "asc" },
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
