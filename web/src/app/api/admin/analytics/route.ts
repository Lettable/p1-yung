import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import CallRecordModel from '@/models/CallRecord';
import TransactionModel from '@/models/Transaction';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const totalCalls = await CallRecordModel.countDocuments();
    const totalAnswered = await CallRecordModel.countDocuments({ status: 'answered' });
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });

    const revenue = await TransactionModel.aggregate([
      { $match: { type: 'topup' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json({
      totalCalls,
      totalAnswered,
      totalUsers,
      activeUsers,
      totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
      answerRate: totalCalls > 0 ? ((totalAnswered / totalCalls) * 100).toFixed(1) : '0',
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
