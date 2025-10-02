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
    const category = searchParams.get("category") || "";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (category && category !== "all") {
      where.category = category;
    }
    
    if (activeOnly) {
      where.isActive = true;
    }

    const products = await db.product.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
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
    const { name, description, price, sku, category, customPrinted } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Convert empty strings to null for unique fields
    const cleanSku = sku?.trim() || null;

    // Check if SKU already exists (if provided)
    if (cleanSku) {
      const existingSku = await db.product.findUnique({
        where: { sku: cleanSku }
      });
      if (existingSku) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    const product = await db.product.create({
      data: {
        name,
        description: description?.trim() || null,
        price: parseFloat(price),
        sku: cleanSku,
        category: category?.trim() || null,
        customPrinted: customPrinted !== undefined ? customPrinted : true,
        isActive: true,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}