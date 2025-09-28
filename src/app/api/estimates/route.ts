import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";
import { generateEstimateNumber } from "@/lib/utils";

// For now, we'll use a simplified estimate structure
// In a full implementation, you might want a separate Estimate model
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: any = {
      // For now, we'll treat invoices with a specific status as estimates
      // In a real app, you'd have a separate Estimate model
      status: "estimate"
    };
    
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const estimates = await db.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        lineItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Estimates GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch estimates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, amount, lineItems, number } = body;

    if (!customerId || !amount) {
      return NextResponse.json(
        { error: "Customer and amount are required" },
        { status: 400 }
      );
    }

    // Get the first company for now
    const company = await db.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { error: "Company not found. Please set up company settings first." },
        { status: 400 }
      );
    }

    // Generate estimate number if not provided
    const estimateNumber = number || await generateEstimateNumber();

    // Create estimate as an invoice with status "estimate"
    const estimate = await db.invoice.create({
      data: {
        number: estimateNumber,
        amount: parseFloat(amount),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        customerId,
        companyId: company.id,
        userId: user.id,
        status: "estimate",
        lineItems: {
          create: lineItems?.map((item: any) => ({
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            description: item.description,
            productId: item.productId || null,
          })) || []
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        lineItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              }
            }
          }
        }
      }
    });

    // Create activity record
    try {
      await db.activity.create({
        data: {
          type: "estimate_created",
          description: `Created estimate ${estimateNumber}`,
          userId: user.id,
          customerId: customerId,
          invoiceId: estimate.id,
        }
      });
    } catch (activityError) {
      console.error("Failed to create activity:", activityError);
    }

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error("Estimates POST error:", error);
    return NextResponse.json(
      { error: "Failed to create estimate" },
      { status: 500 }
    );
  }
}