import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'photo' or 'document' or 'logo'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Handle different upload types
    if (type === 'logo' || !type) {
      // Legacy support for logo uploads - return base64
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image files are allowed for logos" },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size must be less than 5MB" },
          { status: 400 }
        );
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const mimeType = file.type;
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        url: dataUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      });
    }

    // Handle file uploads for work orders
    const allowedTypes = {
      photo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
      document: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    const validTypes = type === 'photo' ? allowedTypes.photo : allowedTypes.document;
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists, continue
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return file information
    return NextResponse.json({
      filename,
      originalName,
      path: `/uploads/${filename}`,
      url: `/api/files/${filename}`,
      size: file.size,
      mimeType: file.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}