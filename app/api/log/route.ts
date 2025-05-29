// app/api/log/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, sessionId, songId, details } = body;

    if (!eventType || !sessionId || !songId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const metric = await prisma.metric.create({
      data: { eventType, sessionId, songId, details },
    });

    return NextResponse.json(metric, { status: 200 });
  } catch (error) {
    console.error('Error logging metric:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
