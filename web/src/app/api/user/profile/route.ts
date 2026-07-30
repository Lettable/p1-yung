import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, callerId, notificationsEnabled } = await req.json();

    await connectToDatabase();

    const user = await UserModel.findByIdAndUpdate(
      (session.user as any)._id,
      {
        fullName,
        'settings.callerID': callerId,
        'settings.notificationsEnabled': notificationsEnabled,
      },
      { new: true }
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
