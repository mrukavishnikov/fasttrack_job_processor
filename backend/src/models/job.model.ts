import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Job status enum representing the lifecycle states of a job.
 * PENDING -> COMPLETED | FAILED
 */
export const JobStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus];

/**
 * Metadata interface for cost tracking.
 * Architecture Note: Designed for future OpenAI API integration.
 * Will store actual token usage and costs when connected to Azure OpenAI.
 */
export interface JobMetadata {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
}

/**
 * Job document interface for type-safe Mongoose operations.
 */
export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  prompt: string;
  status: JobStatusType;
  result: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: JobMetadata;
}

const jobMetadataSchema = new Schema<JobMetadata>(
  {
    promptTokens: { type: Number },
    completionTokens: { type: Number },
    totalTokens: { type: Number },
    estimatedCost: { type: Number },
  },
  { _id: false }
);

const jobSchema = new Schema<IJob>(
  {
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      trim: true,
      maxlength: [10000, 'Prompt cannot exceed 10000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
      index: true, // Index for filtering by status
    },
    result: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    metadata: {
      type: jobMetadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Compound index for common queries: status + createdAt for sorted lists
jobSchema.index({ status: 1, createdAt: -1 });

export const Job: Model<IJob> = mongoose.model<IJob>('Job', jobSchema);

