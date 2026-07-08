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

    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        userId: session.user.id as string,
      },
      include: { plan: true },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Get subscriptions error:", error);
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

    const { planId } = await request.json();

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!wallet || wallet.balance < plan.price) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId: session.user.id as string },
      data: {
        balance: {
          decrement: plan.price.toNumber(),
        },
      },
    });

    // Create subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDay);

    const subscription = await prisma.userSubscription.create({
      data: {
        userId: session.user.id as string,
        planId,
        status: "ACTIVE",
        endDate,
      },
      include: { plan: true },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: session.user.id as string,
        type: "SUBSCRIPTION_PURCHASE",
        amount: plan.price,
        description: `Subscription: ${plan.name}`,
        referenceId: subscription.id,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id as string,
        type: "SUBSCRIPTION_ACTIVE",
        title: "Subscription Active",
        message: `Your ${plan.name} subscription is now active`,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
