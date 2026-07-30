import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import TransactionModel from '@/models/Transaction';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create transaction
    await TransactionModel.create({
      userId: user._id,
      type: 'topup',
      amount,
      paymentMethod: 'admin_manual',
      description: `Admin topup: €${(amount / 100).toFixed(2)}`,
      createdBy: (session.user as any)._id,
      status: 'completed',
    });

    // Update balance
    user.accountBalance += amount;
    await user.save();

    return NextResponse.json({
      success: true,
      newBalance: user.accountBalance,
    });
  } catch (error) {
    console.error('Admin topup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
