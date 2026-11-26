import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/security';
import { endUserSession } from '@/lib/auth';

export const POST = apiRoute(async () => { await endUserSession(); return NextResponse.json({ ok: true }); });
