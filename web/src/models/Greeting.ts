import mongoose, { Schema, Document } from 'mongoose';
import type { Greeting as GreetingType } from '@/types';

interface IGreeting extends GreetingType, Document {}

const greetingSchema = new Schema<IGreeting>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['bank', 'telecom', 'custom', 'test'],
      default: 'custom',
      index: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
greetingSchema.index({ isGlobal: 1, category: 1 });
greetingSchema.index({ createdBy: 1 });

export default mongoose.models.Greeting ||
  mongoose.model<IGreeting>('Greeting', greetingSchema);
