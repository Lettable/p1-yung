import mongoose, { Schema, Document } from 'mongoose';
import type { User as UserType } from '@/types';

interface IUser extends UserType, Document {}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'agent', 'client'],
      default: 'client',
      index: true,
    },
    accountBalance: {
      type: Number,
      default: 0,
    },
    monthlySpent: {
      type: Number,
      default: 0,
    },
    accountCreatedAt: {
      type: Date,
      default: () => new Date(),
    },
    lastLoginAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    settings: {
      callerID: String,
      selectedAudio: {
        type: String,
        default: 'test',
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
userSchema.index({ isActive: 1, role: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
