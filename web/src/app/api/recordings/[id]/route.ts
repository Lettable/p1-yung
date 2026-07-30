import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import CallRecordModel from '@/models/CallRecord';

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

    const call = await CallRecordModel.findById(params.id);

    if (!call || call.userId.toString() !== (session.user as any)._id.toString()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // In production, this would stream the file from disk
    // For now, return the recording metadata
    return NextResponse.json({
      recordingPath: call.recordingPath,
      recordingUrl: call.recordingUrl,
      duration: call.duration,
      phoneNumber: call.phoneNumber,
    });
  } catch (error) {
    console.error('Recording fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
