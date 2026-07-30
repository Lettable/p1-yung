import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import CallRecordModel from '@/models/CallRecord';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const campaignId = searchParams.get('campaignId');

    await connectToDatabase();

    const query: any = { userId: (session.user as any)._id };

    if (status) query.status = status;
    if (campaignId) query.campaignId = campaignId;

    const calls = await CallRecordModel.find(query).sort({ startTime: -1 }).limit(100);

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Calls fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await connectToDatabase();

    const callRecord = await CallRecordModel.create({
      userId: (session.user as any)._id,
      ...body,
    });

    return NextResponse.json(callRecord, { status: 201 });
  } catch (error) {
    console.error('Call create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
