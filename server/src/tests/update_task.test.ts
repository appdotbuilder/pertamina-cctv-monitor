import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (data: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: data.title,
      description: data.description,
      is_completed: data.is_completed
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description',
      is_completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTask.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.is_completed).toEqual(false); // Should remain unchanged
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > testTask.updated_at).toBe(true); // Should be updated
  });

  it('should update task description only', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Test Task',
      description: 'Original description',
      is_completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Task'); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.is_completed).toEqual(false); // Should remain unchanged
  });

  it('should update task completion status only', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Test Task',
      description: 'Test description',
      is_completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Task'); // Should remain unchanged
    expect(result!.description).toEqual('Test description'); // Should remain unchanged
    expect(result!.is_completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description',
      is_completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title',
      description: 'Updated description',
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.is_completed).toEqual(true);
    expect(result!.updated_at > testTask.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    // Create a test task with description
    const testTask = await createTestTask({
      title: 'Test Task',
      description: 'Some description',
      is_completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
  });

  it('should return null when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description',
      is_completed: false
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title',
      is_completed: true
    };

    await updateTask(updateInput);

    // Query the database directly to verify changes were persisted
    const updatedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0].title).toEqual('Updated Title');
    expect(updatedTask[0].description).toEqual('Original description');
    expect(updatedTask[0].is_completed).toEqual(true);
    expect(updatedTask[0].updated_at).toBeInstanceOf(Date);
    expect(updatedTask[0].updated_at > testTask.updated_at).toBe(true);
  });

  it('should always update the updated_at timestamp', async () => {
    // Create a test task
    const testTask = await createTestTask({
      title: 'Test Task',
      description: 'Test description',
      is_completed: false
    });

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Same Title Change' // Even small changes should update timestamp
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > testTask.updated_at).toBe(true);
  });
});