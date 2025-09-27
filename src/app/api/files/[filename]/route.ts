import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getCurrentSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Check authentication for file access
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { filename } = params;
    
    // Security: Only allow files from uploads directory
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filepath = join(process.cwd(), 'uploads', filename);
    
    try {
      const fileBuffer = await readFile(filepath);
      
      // Determine content type based on file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: { [key: string]: string } = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      const contentType = contentTypeMap[extension || ''] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    } catch (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

  } catch (error) {
    console.error('File access error:', error);
    return NextResponse.json({ error: 'Failed to access file' }, { status: 500 });
  }
}