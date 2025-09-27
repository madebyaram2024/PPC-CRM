import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSessionUser } from "@/lib/auth";

export async function POST(
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
    const { filename, originalName, path, mimeType, size } = body;

    if (!filename || !originalName || !path) {
      return NextResponse.json(
        { error: "Missing file information" },
        { status: 400 }
      );
    }

    // Check if work order exists
    const workOrder = await db.workOrder.findUnique({
      where: { id: params.id }
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Create document record
    const document = await db.workOrderDocument.create({
      data: {
        filename,
        originalName,
        path,
        mimeType: mimeType || 'application/octet-stream',
        size: size || 0,
        workOrderId: params.id,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    // Create activity record
    try {
      await db.activity.create({
        data: {
          type: "document_uploaded",
          description: `Document "${originalName}" uploaded to work order ${workOrder.number}`,
          userId: user.id,
        }
      });
    } catch (activityError) {
      console.error("Failed to create activity:", activityError);
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}

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

    const documents = await db.workOrderDocument.findMany({
      where: { workOrderId: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}