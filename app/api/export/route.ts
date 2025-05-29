import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const metrics = await prisma.metric.findMany({
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to export metrics' }, { status: 500 });
  }
}
