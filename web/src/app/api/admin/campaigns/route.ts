import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import CallCampaignModel from '@/models/CallCampaign';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const campaigns = await CallCampaignModel.find()
      .populate('userId', 'email username')
      .sort({ createdAt: -1 });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Admin campaigns fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
