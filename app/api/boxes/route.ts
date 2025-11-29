import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const boxes = await prisma.box.findMany({
      include: {
        links: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(boxes);
  } catch (error) {
    console.error('Error fetching boxes:', error);
    return NextResponse.json({ error: 'Failed to fetch boxes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const box = await prisma.box.create({
      data: {
        name,
        description,
      },
      include: {
        links: true, // Return empty links array to match type
      },
    });

    return NextResponse.json(box);
  } catch (error) {
    console.error('Error creating box:', error);
    return NextResponse.json({ error: 'Failed to create box' }, { status: 500 });
  }
}

