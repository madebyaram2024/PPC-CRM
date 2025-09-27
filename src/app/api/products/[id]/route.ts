import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { name, description, price, sku, category, isActive } = body;

    // Check if SKU already exists (excluding current product)
    if (sku) {
      const existingProduct = await db.product.findFirst({
        where: { 
          sku, 
          NOT: { id: params.id }
        }
      });

      if (existingProduct) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        sku,
        category,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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
    // Check if product is used in any line items
    const lineItemsCount = await db.lineItem.count({
      where: { productId: params.id }
    });

    if (lineItemsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete product that is used in invoices" },
        { status: 400 }
      );
    }

    await db.product.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}