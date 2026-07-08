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

    // Check if already purchased or has subscription
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    if (!video.isPremium) {
      return NextResponse.json(
        { error: "Cannot purchase free video" },
        { status: 400 }
      );
    }

    // Check if already purchased
    const existing = await prisma.videoPurchase.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id as string,
          videoId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already purchased" },
        { status: 409 }
      );
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!wallet || wallet.balance < (video.price || 0)) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Deduct from buyer wallet
    await prisma.wallet.update({
      where: { userId: session.user.id as string },
      data: {
        balance: {
          decrement: (video.price || 0).toNumber(),
        },
      },
    });

    // Add to admin wallet
    await prisma.wallet.update({
      where: { userId: video.adminId },
      data: {
        balance: {
          increment: (video.price || 0).toNumber(),
        },
      },
    });

    // Create purchase record
    const purchase = await prisma.videoPurchase.create({
      data: {
        userId: session.user.id as string,
        videoId,
        price: video.price || 0,
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: session.user.id as string,
        type: "VIDEO_PURCHASE",
        amount: video.price || 0,
        description: `Video: ${video.title}`,
        referenceId: purchase.id,
      },
    });

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: session.user.id as string,
        type: "VIDEO_PURCHASED",
        title: "Video Purchased",
        message: `You have successfully purchased "${video.title}"`,
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Purchase video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
