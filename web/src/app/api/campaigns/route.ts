import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import CallCampaignModel from '@/models/CallCampaign';
import UserModel from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaignName, phoneNumbers, greetingAudio } = await req.json();

    if (!campaignName || !phoneNumbers || phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const campaign = await CallCampaignModel.create({
      userId: (session.user as any)._id,
      campaignName,
      phoneNumbers,
      greetingAudio,
      status: 'draft',
      totalCalls: phoneNumbers.length,
      completedCalls: 0,
      answeredCalls: 0,
      failedCalls: 0,
      costPerMinute: 0.05,
      totalCost: 0,
      trunkCapacity: 27,
      currentTrunksInUse: 0,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const campaigns = await CallCampaignModel.find({
      userId: (session.user as any)._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Campaign fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
