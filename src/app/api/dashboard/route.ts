import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get total customers count
    const totalCustomers = await db.customer.count({
      where: { status: "customer" }
    });

    // Get new prospects count
    const newProspects = await db.customer.count({
      where: { status: "prospect" }
    });

    // Get pending invoices count
    const pendingInvoices = await db.invoice.count({
      where: { status: "pending" }
    });

    // Get recent activities
    const recentActivities = await db.activity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true }
        },
        customer: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({
      totalCustomers,
      newProspects,
      pendingInvoices,
      recentActivities
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}