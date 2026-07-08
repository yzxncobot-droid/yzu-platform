import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewHistory = await prisma.viewHistory.findMany({
      where: { userId: session.user.id as string },
      include: {
        video: {
          include: {
            category: true,
            admin: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(viewHistory);
  } catch (error) {
    console.error("Get view history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, watchDuration } = await request.json();

    // Check if already exists
    const existing = await prisma.viewHistory.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId: session.user.id as string,
        },
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.viewHistory.update({
        where: { id: existing.id },
        data: {
          watchDuration,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    } else {
      // Create new
      const created = await prisma.viewHistory.create({
        data: {
          videoId,
          userId: session.user.id as string,
          watchDuration,
        },
      });

      // Increment video view count
      await prisma.video.update({
        where: { id: videoId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    console.error("Create view history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
