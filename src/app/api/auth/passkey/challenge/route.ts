import { NextRequest, NextResponse } from 'next/server';
import {
  generatePasskeyChallenge,
  PASKEY_CHALLENGE_COOKIE_NAME,
} from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const isSecureCookie = process.env.NODE_ENV === 'production' && !isLocalhost;

  const { challenge, token } = generatePasskeyChallenge();

  const response = NextResponse.json({
    challenge,
    rp: {
      name: 'Scam Shield Bharat',
      id: 'scamshieldbharat.live',
    },
    timeout: 60000,
    userVerification: 'preferred',
  });

  response.cookies.set({
    name: PASKEY_CHALLENGE_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: 300, // 5 minutes
  });

  return response;
}
