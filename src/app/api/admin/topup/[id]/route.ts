import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action } = await request.json();
    const topupId = params.id;

    if (action === "approve") {
      const topupRequest = await prisma.topupRequest.findUnique({
        where: { id: topupId },
      });

      if (!topupRequest) {
        return NextResponse.json(
          { error: "Topup request not found" },
          { status: 404 }
        );
      }

      // Update wallet
      await prisma.wallet.update({
        where: { userId: topupRequest.userId },
        data: {
          balance: {
            increment: topupRequest.nominal.toNumber(),
          },
        },
      });

      // Update topup request
      const updatedTopup = await prisma.topupRequest.update({
        where: { id: topupId },
        data: {
          status: "SUCCESS",
          approvedAt: new Date(),
          approvedBy: session.user.id as string,
        },
      });

      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: topupRequest.userId,
          type: "TOPUP",
          amount: topupRequest.nominal,
          referenceId: topupId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: topupRequest.userId,
          type: "TOPUP_APPROVED",
          title: "Top Up Approved",
          message: `Your top up request of Rp ${topupRequest.nominal} has been approved`,
        },
      });

      return NextResponse.json(updatedTopup);
    } else if (action === "reject") {
      const { rejectionReason } = await request.json();

      const updatedTopup = await prisma.topupRequest.update({
        where: { id: topupId },
        data: {
          status: "REJECTED",
          rejectionReason,
        },
      });

      // Create notification
      const topupRequest = await prisma.topupRequest.findUnique({
        where: { id: topupId },
      });

      if (topupRequest) {
        await prisma.notification.create({
          data: {
            userId: topupRequest.userId,
            type: "TOPUP_REJECTED",
            title: "Top Up Rejected",
            message: `Your top up request has been rejected. Reason: ${rejectionReason}`,
          },
        });
      }

      return NextResponse.json(updatedTopup);
    } else if (action === "delete") {
      await prisma.topupRequest.delete({
        where: { id: topupId },
      });

      return NextResponse.json(
        { message: "Topup request deleted" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update topup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
