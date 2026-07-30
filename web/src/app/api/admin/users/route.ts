import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import CallRecordModel from '@/models/CallRecord';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const users = await UserModel.find().select('-passwordHash');

    // Enrich with call counts
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const callCount = await CallRecordModel.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          totalCalls: callCount,
        };
      })
    );

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
