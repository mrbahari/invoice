
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = '/tmp/uploads/ads';

async function ensureUploadDirExists() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  await ensureUploadDirExists();

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new NextResponse(JSON.stringify({ error: "No file uploaded." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const uniqueFilename = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Return as a Base64 Data URI
    const dataUri = `data:${file.type};base64,${fileBuffer.toString('base64')}`;
    
    return NextResponse.json({ url: dataUri });

  } catch (error: any) {
    console.error('File upload error:', error);
    return new NextResponse(JSON.stringify({ error: `Upload failed: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
