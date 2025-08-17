import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTask = async (input: GetTaskInput): Promise<Task | null> => {
  try {
    // Query for the task by ID
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return null if task not found, otherwise return the first result
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
};