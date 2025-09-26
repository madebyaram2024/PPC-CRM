import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has customers or invoices
    const user = await db.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            customers: true,
            invoices: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user._count.customers > 0 || user._count.invoices > 0) {
      return NextResponse.json(
        { error: "Cannot delete user with existing customers or invoices" },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}