import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { companyPhone: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status && status !== "all") {
      where.status = status;
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true,
        companyName: true,
        companyPhone: true,
        website: true,
        contactName: true,
        directNumber: true,
        contactEmail: true,
        billingAddress: true,
        shippingAddress: true,
        notes: true,
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
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      status,
      companyName,
      companyPhone,
      website,
      contactName,
      directNumber,
      contactEmail,
      billingAddress,
      shippingAddress,
      notes
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Get the first company for now (could be improved to use user's company)
    const company = await db.company.findFirst();
    const companyId = company?.id || "default-company";

    const customer = await db.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        status: status || "prospect",
        companyName,
        companyPhone,
        website,
        contactName,
        directNumber,
        contactEmail,
        billingAddress,
        shippingAddress,
        notes,
        companyId: companyId,
        userId: user.id,
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
    try {
      await db.activity.create({
        data: {
          type: "customer_created",
          description: `Created new ${status || "prospect"}`,
          userId: user.id,
          customerId: customer.id,
        }
      });
    } catch (activityError) {
      // Log but don't fail if activity creation fails
      console.error("Failed to create activity:", activityError);
    }

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}