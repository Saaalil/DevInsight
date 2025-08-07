import mongoose, { Document, Schema } from 'mongoose';

export interface IRepository extends Document {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  apiUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  defaultBranch: string;
  createdAt: Date;
  updatedAt: Date;
  lastFetched: Date;
  users: mongoose.Types.ObjectId[];
  metrics: {
    commits: {
      total: number;
      weekly: number[];
    };
    pullRequests: {
      open: number;
      closed: number;
      merged: number;
    };
    issues: {
      open: number;
      closed: number;
    };
    contributors: number;
    mergeTime: number; // Average time in hours
  };
  alerts: {
    noActivity: boolean;
    longOpenPRs: boolean;
    commitDrops: boolean;
  };
}

const repositorySchema = new Schema<IRepository>(
  {
    owner: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    apiUrl: {
      type: String,
      required: true,
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    openIssues: {
      type: Number,
      default: 0,
    },
    watchers: {
      type: Number,
      default: 0,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    lastFetched: {
      type: Date,
      default: Date.now,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    metrics: {
      commits: {
        total: {
          type: Number,
          default: 0,
        },
        weekly: [
          {
            type: Number,
          },
        ],
      },
      pullRequests: {
        open: {
          type: Number,
          default: 0,
        },
        closed: {
          type: Number,
          default: 0,
        },
        merged: {
          type: Number,
          default: 0,
        },
      },
      issues: {
        open: {
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
    alerts: {
      noActivity: {
        type: Boolean,
        default: false,
      },
      longOpenPRs: {
        type: Boolean,
        default: false,
      },
      commitDrops: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Repository = mongoose.model<IRepository>('Repository', repositorySchema);

export default Repository;