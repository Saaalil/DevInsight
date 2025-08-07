import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  user: mongoose.Types.ObjectId;
  repository: mongoose.Types.ObjectId;
  type: 'noActivity' | 'longOpenPRs' | 'commitDrops';
  message: string;
  threshold: number;
  value: number;
  status: 'active' | 'resolved' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repository: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    type: {
      type: String,
      enum: ['noActivity', 'longOpenPRs', 'commitDrops'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'dismissed'],
      default: 'active',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Alert = mongoose.model<IAlert>('Alert', alertSchema);

export default Alert;