import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import UserModel from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, fullName, password } = body;

    // Validation
    if (!email || !username || !fullName || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user exists
    const existingUser = await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate API key
    const apiKey = `pk_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    // Create user
    const user = await UserModel.create({
      email: email.toLowerCase(),
      username,
      fullName,
      passwordHash,
      apiKey,
      role: 'client',
      accountBalance: 0,
      isActive: true,
      settings: {
        notificationsEnabled: true,
        emailNotifications: false,
        selectedAudio: 'test',
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        userId: user._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
