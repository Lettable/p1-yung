import mongoose, { Schema, Document } from 'mongoose';
import type { Transaction as TransactionType } from '@/types';

interface ITransaction extends TransactionType, Document {}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['topup', 'charge'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['admin_manual', 'stripe', 'crypto', 'other'],
      default: 'admin_manual',
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'CallCampaign',
      sparse: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, userId: 1 });
transactionSchema.index({ campaignId: 1 });

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', transactionSchema);
