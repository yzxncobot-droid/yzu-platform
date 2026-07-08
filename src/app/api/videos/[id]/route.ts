import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        category: true,
        admin: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error("Get video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
