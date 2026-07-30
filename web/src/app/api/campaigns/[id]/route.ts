import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import CallCampaignModel from '@/models/CallCampaign';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const campaign = await CallCampaignModel.findById(params.id);

    if (!campaign || campaign.userId.toString() !== (session.user as any)._id.toString()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Campaign fetch error:', error);
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

    const campaign = await CallCampaignModel.findByIdAndUpdate(params.id, updates, { new: true });

    if (!campaign || campaign.userId.toString() !== (session.user as any)._id.toString()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Campaign update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
