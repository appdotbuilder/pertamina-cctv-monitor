import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a test task first
    const [testTask] = await db.insert(tasksTable)
      .values({
        title: 'Task to Delete',
        description: 'This task will be deleted',
        is_completed: false
      })
      .returning()
      .execute();

    const input: DeleteTaskInput = {
      id: testTask.id
    };

    // Delete the task
    const result = await deleteTask(input);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify task is no longer in database
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should return false when task does not exist', async () => {
    const input: DeleteTaskInput = {
      id: 9999 // Non-existent task ID
    };

    const result = await deleteTask(input);

    // Should return false since no task was deleted
    expect(result).toBe(false);
  });

  it('should not affect other tasks when deleting', async () => {
    // Create multiple test tasks
    const [task1, task2, task3] = await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          is_completed: false
        },
        {
          title: 'Task 2', 
          description: 'Second task',
          is_completed: true
        },
        {
          title: 'Task 3',
          description: 'Third task', 
          is_completed: false
        }
      ])
      .returning()
      .execute();

    // Delete the middle task
    const input: DeleteTaskInput = {
      id: task2.id
    };

    const result = await deleteTask(input);
    expect(result).toBe(true);

    // Verify only task2 was deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    const remainingIds = remainingTasks.map(task => task.id);
    expect(remainingIds).toContain(task1.id);
    expect(remainingIds).toContain(task3.id);
    expect(remainingIds).not.toContain(task2.id);
  });

  it('should delete task with null description', async () => {
    // Create a task with null description
    const [testTask] = await db.insert(tasksTable)
      .values({
        title: 'Task with Null Description',
        description: null,
        is_completed: true
      })
      .returning()
      .execute();

    const input: DeleteTaskInput = {
      id: testTask.id
    };

    const result = await deleteTask(input);

    expect(result).toBe(true);

    // Verify task is deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should handle completed and incomplete tasks equally', async () => {
    // Create both completed and incomplete tasks
    const [completedTask, incompleteTask] = await db.insert(tasksTable)
      .values([
        {
          title: 'Completed Task',
          description: 'This task is done',
          is_completed: true
        },
        {
          title: 'Incomplete Task',
          description: 'This task is not done',
          is_completed: false
        }
      ])
      .returning()
      .execute();

    // Delete completed task
    let result = await deleteTask({ id: completedTask.id });
    expect(result).toBe(true);

    // Delete incomplete task
    result = await deleteTask({ id: incompleteTask.id });
    expect(result).toBe(true);

    // Verify both tasks are deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });
});