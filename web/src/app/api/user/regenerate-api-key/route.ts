import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const newApiKey = `pk_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    const user = await UserModel.findByIdAndUpdate(
      (session.user as any)._id,
      { apiKey: newApiKey },
      { new: true }
    );

    return NextResponse.json({
      apiKey: user?.apiKey,
    });
  } catch (error) {
    console.error('API key regeneration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
