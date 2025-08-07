import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  user: mongoose.Types.ObjectId;
  repository: mongoose.Types.ObjectId;
  reportType: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  data: {
    commits: number;
    pullRequests: {
      opened: number;
      merged: number;
      closed: number;
    };
    issues: {
      opened: number;
      closed: number;
    };
    contributors: number;
    mergeTime: number; // Average time in hours
  };
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
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
    reportType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    data: {
      commits: {
        type: Number,
        default: 0,
      },
      pullRequests: {
        opened: {
          type: Number,
          default: 0,
        },
        merged: {
          type: Number,
          default: 0,
        },
        closed: {
          type: Number,
          default: 0,
        },
      },
      issues: {
        opened: {
          type: Number,
          default: 0,
        },
        closed: {
          type: Number,
          default: 0,
        },
      },
      contributors: {
        type: Number,
        default: 0,
      },
      mergeTime: {
        type: Number,
        default: 0,
      },
    },
    sentAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model<IReport>('Report', reportSchema);

export default Report;