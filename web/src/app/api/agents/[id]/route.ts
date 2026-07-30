import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import AgentModel from '@/models/Agent';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const agent = await AgentModel.findById(params.id);

    if (!agent || agent.userId.toString() !== (session.user as any)._id.toString()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await AgentModel.deleteOne({ _id: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Agent delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await req.json();

    await connectToDatabase();

    const agent = await AgentModel.findByIdAndUpdate(params.id, updates, { new: true });

    if (!agent || agent.userId.toString() !== (session.user as any)._id.toString()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Agent update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
