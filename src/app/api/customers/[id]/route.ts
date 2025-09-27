import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
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

    const customer = await db.customer.update({
      where: { id: params.id },
      data: {
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
        notes,
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

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await db.customer.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}