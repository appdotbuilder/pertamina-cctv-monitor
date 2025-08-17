import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when found', async () => {
    // Create a test task first
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        is_completed: false
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    // Test getting the task
    const input: GetTaskInput = {
      id: createdTask.id
    };

    const result = await getTask(input);

    // Verify the task was found and returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing');
    expect(result!.is_completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task is not found', async () => {
    const input: GetTaskInput = {
      id: 99999 // Non-existent ID
    };

    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should handle tasks with null description', async () => {
    // Create a task with null description
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Task with No Description',
        description: null,
        is_completed: true
      })
      .returning()
      .execute();

    const createdTask = insertResult[0];

    const input: GetTaskInput = {
      id: createdTask.id
    };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Task with No Description');
    expect(result!.description).toBeNull();
    expect(result!.is_completed).toEqual(true);
  });

  it('should return the correct task when multiple tasks exist', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'First description',
        is_completed: false
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Second description',
        is_completed: true
      })
      .returning()
      .execute();

    // Get the second task specifically
    const input: GetTaskInput = {
      id: task2[0].id
    };

    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(task2[0].id);
    expect(result!.title).toEqual('Second Task');
    expect(result!.description).toEqual('Second description');
    expect(result!.is_completed).toEqual(true);
    
    // Ensure it's not the first task
    expect(result!.id).not.toEqual(task1[0].id);
    expect(result!.title).not.toEqual('First Task');
  });
});