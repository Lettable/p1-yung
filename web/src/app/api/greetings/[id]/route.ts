import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import GreetingModel from '@/models/Greeting';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const greeting = await GreetingModel.findById(params.id);

    if (!greeting || (greeting.createdBy && greeting.createdBy.toString() !== (session.user as any)._id.toString())) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await GreetingModel.deleteOne({ _id: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Greeting delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
