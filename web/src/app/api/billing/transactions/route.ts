import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import TransactionModel from '@/models/Transaction';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const transactions = await TransactionModel.find({
      userId: (session.user as any)._id,
    }).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
