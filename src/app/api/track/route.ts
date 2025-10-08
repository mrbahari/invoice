
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { headers } from 'next/headers';

// Initialize Firebase Admin SDK
const app = initializeFirebase();
const firestore = app ? getFirestore(app) : null;

export async function POST(req: NextRequest) {
  if (!firestore) {
    return new NextResponse(JSON.stringify({ error: 'Firestore is not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { userId, screenResolution, userAgent } = body;
    
    // Get IP address from headers
    const forwarded = headers().get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(/, /)[0] : headers().get('x-real-ip') || req.ip;

    const logData = {
      userId: userId || null,
      ipAddress: ip || 'unknown',
      userAgent: userAgent || 'unknown',
      screenResolution: screenResolution || 'unknown',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
    };

    const docRef = await firestore.collection('visitorLogs').add(logData);

    return NextResponse.json({ success: true, logId: docRef.id });
  } catch (error: any) {
    console.error('Visitor tracking error:', error);
    return new NextResponse(JSON.stringify({ error: `Tracking failed: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
