import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import CallRecordModel from '@/models/CallRecord';
import TransactionModel from '@/models/Transaction';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  await connectToDatabase();

  const user = await UserModel.findById((session.user as any)._id);

  if (!user) {
    redirect('/auth/login');
  }

  // Get dashboard stats
  const totalCalls = await CallRecordModel.countDocuments({ userId: user._id });
  const answeredCalls = await CallRecordModel.countDocuments({
    userId: user._id,
    status: 'answered',
  });
  const totalSpent = await TransactionModel.aggregate([
    { $match: { userId: user._id, type: 'charge' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const stats = {
    totalCalls,
    answeredCalls,
    answerRate: totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : '0',
    totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
    accountBalance: user.accountBalance,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user.fullName}!</h1>
        <p className="text-textSecondary">Manage your VoIP campaigns and monitor calls in real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Balance Card */}
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Account Balance</div>
          <div className="text-3xl font-bold text-accent">€{(user.accountBalance / 100).toFixed(2)}</div>
        </div>

        {/* Total Calls Card */}
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Total Calls</div>
          <div className="text-3xl font-bold text-white">{stats.totalCalls}</div>
        </div>

        {/* Answered Calls Card */}
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Answered</div>
          <div className="text-3xl font-bold text-white">{stats.answeredCalls}</div>
        </div>

        {/* Answer Rate Card */}
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Answer Rate</div>
          <div className="text-3xl font-bold text-white">{stats.answerRate}%</div>
        </div>

        {/* Total Spent Card */}
        <div className="card">
          <div className="text-textSecondary text-sm mb-2">Total Spent</div>
          <div className="text-3xl font-bold text-white">€{(stats.totalSpent / 100).toFixed(2)}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a
            href="/dashboard/dialer"
            className="btn-primary text-center py-3"
          >
            📞 Start New Campaign
          </a>
          <a
            href="/dashboard/calls"
            className="btn-secondary text-center py-3"
          >
            📊 View Call History
          </a>
          <a
            href="/dashboard/billing"
            className="btn-secondary text-center py-3"
          >
            💳 Add Balance
          </a>
        </div>
      </div>

      {/* System Information */}
      {user.role === 'admin' && (
        <div className="card border border-accent border-opacity-30">
          <h2 className="text-xl font-bold text-white mb-4">Admin Panel</h2>
          <a href="/dashboard/admin" className="btn-primary">
            Access Admin Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
