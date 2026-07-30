import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import AgentModel from '@/models/Agent';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const agents = await AgentModel.find({
      userId: (session.user as any)._id,
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Agents fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentName, extensionNumber } = await req.json();

    if (!agentName || !extensionNumber) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();

    const agent = await AgentModel.create({
      userId: (session.user as any)._id,
      agentName,
      extensionNumber: parseInt(extensionNumber),
      isActive: true,
      isOnline: false,
      totalCallsHandled: 0,
      totalDtmfCaptured: [],
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Agent create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
