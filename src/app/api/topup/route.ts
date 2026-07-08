import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nominal, proofImage } = await request.json();

    if (!nominal || nominal <= 0) {
      return NextResponse.json(
        { error: "Invalid nominal" },
        { status: 400 }
      );
    }

    const topupRequest = await prisma.topupRequest.create({
      data: {
        userId: session.user.id as string,
        nominal: BigInt(nominal * 100) / 100n,
        proofImage,
        status: "PENDING_CONFIRMATION",
      },
    });

    return NextResponse.json(topupRequest, { status: 201 });
  } catch (error) {
    console.error("Create topup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topupRequests = await prisma.topupRequest.findMany({
      where: { userId: session.user.id as string },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(topupRequests);
  } catch (error) {
    console.error("Get topup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
