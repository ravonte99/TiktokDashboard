import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.box.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting box:', error);
    return NextResponse.json({ error: 'Failed to delete box' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();
    
    const box = await prisma.box.update({
      where: { id },
      data: updates,
      include: {
        links: true,
      },
    });
    
    return NextResponse.json(box);
  } catch (error) {
    console.error('Error updating box:', error);
    return NextResponse.json({ error: 'Failed to update box' }, { status: 500 });
  }
}

