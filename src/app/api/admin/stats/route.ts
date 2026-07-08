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

    // Count statistics
    const totalUsers = await prisma.user.count();
    const totalVideos = await prisma.video.count();
    const activeSubscriptions = await prisma.userSubscription.count({
      where: { status: "ACTIVE" },
    });

    const totalRevenue = await prisma.transaction.aggregate({
      where: { type: { in: ["VIDEO_PURCHASE", "SUBSCRIPTION_PURCHASE"] } },
      _sum: { amount: true },
    });

    const totalTopup = await prisma.transaction.aggregate({
      where: { type: "TOPUP" },
      _sum: { amount: true },
    });

    const totalViews = await prisma.video.aggregate({
      _sum: { viewCount: true },
    });

    return NextResponse.json({
      totalUsers,
      totalVideos,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalTopup: totalTopup._sum.amount || 0,
      totalViews: totalViews._sum.viewCount || 0,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
