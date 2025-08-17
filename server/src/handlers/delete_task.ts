import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<boolean> => {
  try {
    // Delete the task with the given ID
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return true if at least one row was deleted, false if no task was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};