import mongoose, { Schema, Document } from 'mongoose';
import type { CallRecord as CallRecordType } from '@/types';

interface ICallRecord extends CallRecordType, Document {}

const callRecordSchema = new Schema<ICallRecord>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'CallCampaign',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    callerID: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'ringing', 'answered', 'failed', 'completed'],
      default: 'pending',
      index: true,
    },
    startTime: {
      type: Date,
      default: () => new Date(),
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    recordingPath: String,
    recordingUrl: String,
    recordingFilesize: Number,
    dtmfPressed: String,
    dtmfPressedTime: Date,
    agentHandledBy: String,
    cost: {
      type: Number,
      default: 0,
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

// Indexes
callRecordSchema.index({ campaignId: 1, createdAt: -1 });
callRecordSchema.index({ userId: 1, createdAt: -1 });
callRecordSchema.index({ phoneNumber: 1 });
callRecordSchema.index({ status: 1 });

export default mongoose.models.CallRecord ||
  mongoose.model<ICallRecord>('CallRecord', callRecordSchema);
