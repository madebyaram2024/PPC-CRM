import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status && status !== "all") {
      where.status = status;
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: { 
            name: true,
            email: true,
            phone: true,
            address: true,
            logo: true
          }
        }
      }
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, status } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // For now, use a default company ID and user ID
    // In a real app, these would come from authentication
    const defaultCompanyId = "default-company-id";
    const defaultUserId = "default-user-id";

    const customer = await db.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        status: status || "prospect",
        companyId: defaultCompanyId,
        userId: defaultUserId,
      },
      include: {
        company: {
          select: { 
            name: true,
            email: true,
            phone: true,
            address: true,
            logo: true
          }
        }
      }
    });

    // Create activity record
    await db.activity.create({
      data: {
        type: "customer_created",
        description: `Created new ${status || "prospect"}`,
        userId: defaultUserId,
        customerId: customer.id,
      }
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}