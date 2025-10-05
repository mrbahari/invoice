import { type NextRequest, NextResponse } from 'next/server';
import { createFirebaseAdminApp } from '@/firebase/admin-config';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
  }

  const adminApp = createFirebaseAdminApp();
  if (!adminApp) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
  }

  const adminAuth = getAuth(adminApp);
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: true,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set(options);
    
    return response;

  } catch (error) {
    console.error('Session cookie creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}
