import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import TransactionModel from '@/models/Transaction';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await req.json();

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum topup is €1' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findById((session.user as any)._id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // In production, this would integrate with Stripe/payment gateway
    // For MVP, we create the transaction as pending until admin approves
    const transaction = await TransactionModel.create({
      userId: user._id,
      type: 'topup',
      amount,
      paymentMethod: 'admin_manual',
      description: `Topup request €${(amount / 100).toFixed(2)}`,
      status: 'pending',
    });

    // Immediately approve for MVP
    user.accountBalance += amount;
    await user.save();

    return NextResponse.json({
      success: true,
      newBalance: user.accountBalance,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Topup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
