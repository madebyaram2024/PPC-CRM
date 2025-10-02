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

    // For now, get the first company or create a default one
    let company = await db.company.findFirst();
    
    if (!company) {
      company = await db.company.create({
        data: {
          name: "US PAPER CUP FACTORY",
          email: "contact@uspapercupfactory.com",
          phone: "+1 (555) 123-4567",
          address: "123 Paper Street, Cup City, PC 12345",
        }
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Company GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, address, logo } = body;

    // Get the first company
    const existingCompany = await db.company.findFirst();
    
    if (!existingCompany) {
      // Create new company if none exists
      const company = await db.company.create({
        data: {
          name,
          email,
          phone,
          address,
          logo,
        }
      });
      return NextResponse.json(company);
    }

    // Update existing company
    const company = await db.company.update({
      where: { id: existingCompany.id },
      data: {
        name,
        email,
        phone,
        address,
        logo,
      }
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Company PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update company data" },
      { status: 500 }
    );
  }
}