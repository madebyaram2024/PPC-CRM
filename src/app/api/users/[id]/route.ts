import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    // Check authentication and admin privileges
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Check if user exists and has associated data
    const targetUser = await db.user.findUnique({
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

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent deleting self
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user has associated data
    if (targetUser._count.customers > 0 || targetUser._count.invoices > 0) {
      return NextResponse.json(
        { error: "Cannot delete user with existing customers or invoices" },
        { status: 400 }
      );
    }

    // Delete the user
    await db.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}