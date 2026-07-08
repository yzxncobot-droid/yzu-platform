import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const videoId = params.id;

    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: {
        videoId_userId: {
          videoId,
          userId: session.user.id as string,
        },
      },
    });

    if (existing) {
      // Unlike
      await prisma.like.delete({
        where: { id: existing.id },
      });

      await prisma.video.update({
        where: { id: videoId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          videoId,
          userId: session.user.id as string,
        },
      });

      await prisma.video.update({
        where: { id: videoId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
