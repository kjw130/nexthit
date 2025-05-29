import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get('x-metric-token');
    const expectedToken = process.env.METRIC_TOKEN;

    if (!authToken || authToken !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { eventType, sessionId, userId, songId, details } = body;

    if (
      !eventType ||
      typeof eventType !== 'string' ||
      !sessionId ||
      typeof sessionId !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
     console.log('📥 Incoming metric:', { eventType, sessionId, userId, songId, details });
    const metric = await prisma.metric.create({
      data: {
        eventType,
        sessionId,
        userId: typeof userId === 'string' ? userId : '',
        songId: typeof songId === 'string' ? songId : '',
        details: typeof details === 'string' ? details : '',
      },
    });
    console.log('🧾 Metric saved:', metric);

    return NextResponse.json(metric, { status: 200 });
  } catch (error) {
    console.log('metric failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
