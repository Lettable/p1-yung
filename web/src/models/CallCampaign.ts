import mongoose, { Schema, Document } from 'mongoose';
import type { CallCampaign as CallCampaignType } from '@/types';

interface ICallCampaign extends CallCampaignType, Document {}

const callCampaignSchema = new Schema<ICallCampaign>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    campaignName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'running', 'paused', 'completed'],
      default: 'draft',
      index: true,
    },
    phoneNumbers: [
      {
        type: String,
        required: true,
      },
    ],
    audioScript: {
      type: String,
      default: 'default_script',
    },
    greetingAudio: {
      type: String,
      default: 'default_greeting',
    },
    totalCalls: {
      type: Number,
      default: 0,
    },
    completedCalls: {
      type: Number,
      default: 0,
    },
    answeredCalls: {
      type: Number,
      default: 0,
    },
    failedCalls: {
      type: Number,
      default: 0,
    },
    averageDuration: {
      type: Number,
      default: 0,
    },
    costPerMinute: {
      type: Number,
      default: 0.05,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    trunkCapacity: {
      type: Number,
      default: 27,
    },
    currentTrunksInUse: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for queries
callCampaignSchema.index({ userId: 1, createdAt: -1 });
callCampaignSchema.index({ status: 1, userId: 1 });

export default mongoose.models.CallCampaign ||
  mongoose.model<ICallCampaign>('CallCampaign', callCampaignSchema);
