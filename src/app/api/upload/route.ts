
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Use the temporary directory which is writable on Vercel
const uploadDir = path.join(os.tmpdir(), 'uploads/ads');

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

    // Save the file to the temporary directory
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Read the file back and convert to a Base64 Data URI
    const base64Data = fileBuffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Data}`;

    // Clean up the temporary file after converting
    // This is important because the /tmp directory has limited space.
    await fs.unlink(filePath);
    
    // Return the Data URI instead of a public URL
    return NextResponse.json({ url: dataUri });

  } catch (error: any) {
    console.error('File upload error:', error);
    return new NextResponse(JSON.stringify({ error: `Upload failed: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
