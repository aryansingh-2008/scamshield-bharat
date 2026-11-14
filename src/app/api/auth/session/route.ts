import { NextRequest, NextResponse } from 'next/server';
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const verification = verifySessionToken(token);

  if (!verification.valid || !verification.user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    user: verification.user,
  });
}
