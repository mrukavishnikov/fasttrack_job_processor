import { Job, type IJob, type JobStatusType, type JobMetadata } from '../models/job.model.js';

/**
 * Job Repository - Data Access Layer
 * 
 * Architecture Note: This layer abstracts MongoDB operations.
 * If switching to PostgreSQL or another DB, only this layer needs changes.
 * Controllers and Services remain untouched.
 */
export class JobRepository {
  /**
   * Creates a new job in the database.
   */
  async create(prompt: string): Promise<IJob> {
    const job = new Job({ prompt });
    return await job.save();
  }

  /**
   * Finds a job by its ID.
   */
  async findById(id: string): Promise<IJob | null> {
    return await Job.findById(id);
  }

  /**
   * Retrieves all jobs, optionally filtered by status.
   * Sorted by creation date (newest first).
   */
  async findAll(status?: JobStatusType): Promise<IJob[]> {
    const query = status ? { status } : {};
    return await Job.find(query).sort({ createdAt: -1 });
  }

  /**
   * Updates a job's status and result/error.
   * Used by webhook callback to complete or fail jobs.
   */
  async updateStatus(
    id: string,
    status: JobStatusType,
    result?: string | null,
    error?: string | null,
    metadata?: JobMetadata
  ): Promise<IJob | null> {
    const updateData: Partial<IJob> = { status };
    
    if (result !== undefined) updateData.result = result;
    if (error !== undefined) updateData.error = error;
    if (metadata) updateData.metadata = metadata;

    return await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // Return updated document
    );
  }

  /**
   * Deletes a job by ID.
   * Useful for cleanup or admin operations.
   */
  async delete(id: string): Promise<boolean> {
    const result = await Job.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Counts jobs by status.
   * Useful for dashboard statistics.
   */
  async countByStatus(): Promise<Record<JobStatusType, number>> {
    const results = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = {
      PENDING: 0,
      COMPLETED: 0,
      FAILED: 0,
    };

    for (const result of results) {
      counts[result._id as JobStatusType] = result.count;
    }

    return counts;
  }
}

