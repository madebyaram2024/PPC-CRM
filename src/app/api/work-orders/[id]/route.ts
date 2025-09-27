import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const workOrder = await db.workOrder.findUnique({
      where: { id: params.id },
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            customer: {
              select: {
                name: true,
                email: true,
                phone: true,
              }
            },
            lineItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    customPrinted: true,
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        documents: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Work Order GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch work order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      status,
      printedCompleted,
      printedPhoto,
      productionCompleted,
      productionPhoto,
      shippedCompleted,
      shippedPhoto
    } = body;

    // Check if work order exists
    const existingWorkOrder = await db.workOrder.findUnique({
      where: { id: params.id }
    });

    if (!existingWorkOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (printedCompleted !== undefined) updateData.printedCompleted = printedCompleted;
    if (printedPhoto !== undefined) updateData.printedPhoto = printedPhoto;
    if (productionCompleted !== undefined) updateData.productionCompleted = productionCompleted;
    if (productionPhoto !== undefined) updateData.productionPhoto = productionPhoto;
    if (shippedCompleted !== undefined) updateData.shippedCompleted = shippedCompleted;
    if (shippedPhoto !== undefined) updateData.shippedPhoto = shippedPhoto;

    // Auto-update status based on completion
    if (existingWorkOrder.customPrinted) {
      // Custom printed: Check all 3 stages
      if (updateData.shippedCompleted || 
          (existingWorkOrder.printedCompleted && existingWorkOrder.productionCompleted && shippedCompleted)) {
        updateData.status = "completed";
      } else if (updateData.printedCompleted || updateData.productionCompleted || 
                 existingWorkOrder.printedCompleted || existingWorkOrder.productionCompleted) {
        updateData.status = "in_progress";
      }
    } else {
      // Regular: Check 2 stages (production, shipped)
      if (updateData.shippedCompleted || 
          (existingWorkOrder.productionCompleted && shippedCompleted)) {
        updateData.status = "completed";
      } else if (updateData.productionCompleted || existingWorkOrder.productionCompleted) {
        updateData.status = "in_progress";
      }
    }

    const workOrder = await db.workOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        invoice: {
          select: {
            id: true,
            number: true,
            customer: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Create activity record for status changes
    if (status && status !== existingWorkOrder.status) {
      try {
        await db.activity.create({
          data: {
            type: "work_order_updated",
            description: `Work order ${workOrder.number} status changed to ${status}`,
            userId: user.id,
            invoiceId: workOrder.invoiceId,
          }
        });
      } catch (activityError) {
        console.error("Failed to create activity:", activityError);
      }
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Work Order PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update work order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only allow admins to delete work orders
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const workOrder = await db.workOrder.findUnique({
      where: { id: params.id }
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Delete the work order (cascade will handle documents)
    await db.workOrder.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Work order deleted successfully" });
  } catch (error) {
    console.error("Work Order DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete work order" },
      { status: 500 }
    );
  }
}