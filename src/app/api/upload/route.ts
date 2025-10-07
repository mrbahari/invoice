
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public/uploads');

async function ensureUploadDirExists() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  await ensureUploadDirExists();

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    filename: (name, ext, part) => {
        // Create a unique filename
        return `${Date.now()}-${part.originalFilename}`;
    }
  });

  try {
    const file = await new Promise<formidable.File>((resolve, reject) => {
      form.parse(req.body as any, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!uploadedFile) {
            reject(new Error("No file uploaded."));
            return;
        }
        resolve(uploadedFile);
      });
    });

    const publicUrl = `/uploads/${file.newFilename}`;
    
    return NextResponse.json({ url: publicUrl });

  } catch (error: any) {
    console.error('File upload error:', error);
    return new NextResponse(JSON.stringify({ error: `Upload failed: ${error.message}` }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
