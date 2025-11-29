import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/links - Create a new link
export async function POST(req: Request) {
  try {
    const { boxId, url, type, title, description, thumbnailUrl } = await req.json();

    if (!boxId || !url || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const link = await prisma.link.create({
      data: {
        boxId,
        url,
        type,
        title: title || url,
        description,
        thumbnailUrl,
        fetchedAt: new Date(),
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}

// PUT /api/links - Update a link (we'll use query param or body for ID usually, but let's use a dynamic route for specific ID operations)
// Actually, for bulk updates or cleaner structure, let's make a separate dynamic route for specific links.

