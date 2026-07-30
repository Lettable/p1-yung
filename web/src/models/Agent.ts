import mongoose, { Schema, Document } from 'mongoose';
import type { Agent as AgentType } from '@/types';

interface IAgent extends AgentType, Document {}

const agentSchema = new Schema<IAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    extensionNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentCallChannel: String,
    currentCallNumber: String,
    currentCallDuration: Number,
    totalCallsHandled: {
      type: Number,
      default: 0,
    },
    totalDtmfCaptured: [String],
    lastLogin: Date,
    qrCode: String,
  },
  {
    timestamps: true,
  },
);

// Indexes
agentSchema.index({ userId: 1 });
agentSchema.index({ isActive: 1, isOnline: 1 });

export default mongoose.models.Agent ||
  mongoose.model<IAgent>('Agent', agentSchema);
