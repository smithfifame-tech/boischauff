import { NextResponse } from 'next/server';
import { apiRoute } from '@/lib/security';
import { endAdminSession } from '@/lib/auth';

export const POST = apiRoute(async () => { await endAdminSession(); return NextResponse.json({ ok: true }); });
