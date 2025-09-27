import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentSessionUser } from '@/lib/auth';

// GET: Retrieve company settings
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the company settings (there's typically one default company)
    const company = await db.company.findFirst({
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error retrieving company settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update company settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const user = await getCurrentSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { name, email, phone, address, logo } = await request.json();

    // Get the company (there should be one default company)
    const existingCompany = await db.company.findFirst();
    
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company settings not found' },
        { status: 404 }
      );
    }

    // Update the company settings
    const updatedCompany = await db.company.update({
      where: { id: existingCompany.id },
      data: {
        name: name || existingCompany.name,
        email: email || existingCompany.email,
        phone: phone || existingCompany.phone,
        address: address || existingCompany.address,
        logo: logo || existingCompany.logo,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
      }
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}