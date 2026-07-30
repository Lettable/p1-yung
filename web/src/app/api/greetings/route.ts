import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import GreetingModel from '@/models/Greeting';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const greetings = await GreetingModel.find({
      $or: [
        { isGlobal: true },
        { createdBy: (session.user as any)._id }
      ]
    });

    return NextResponse.json(greetings);
  } catch (error) {
    console.error('Greetings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;

    if (!file || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();

    const greeting = await GreetingModel.create({
      name,
      filename: file.name,
      duration: 0,
      category: 'custom',
      audioUrl: `/api/greetings/download/${file.name}`,
      createdBy: (session.user as any)._id,
      isGlobal: false,
    });

    return NextResponse.json(greeting, { status: 201 });
  } catch (error) {
    console.error('Greeting upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
