import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const basicTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  is_completed: false
};

const completedTaskInput: CreateTaskInput = {
  title: 'Completed Test Task',
  description: 'A completed task for testing',
  is_completed: true
};

const nullDescriptionInput: CreateTaskInput = {
  title: 'Task with null description',
  description: null,
  is_completed: false
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a basic task with all fields', async () => {
    const result = await createTask(basicTaskInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a completed task', async () => {
    const result = await createTask(completedTaskInput);

    expect(result.title).toEqual('Completed Test Task');
    expect(result.description).toEqual('A completed task for testing');
    expect(result.is_completed).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const result = await createTask(nullDescriptionInput);

    expect(result.title).toEqual('Task with null description');
    expect(result.description).toBeNull();
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(basicTaskInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].is_completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle Zod defaults correctly', async () => {
    // Test input without is_completed (should use Zod default of false)
    const inputWithoutIsCompleted = {
      title: 'Task with default completion status',
      description: 'Testing default values'
    };

    const result = await createTask(inputWithoutIsCompleted as CreateTaskInput);

    expect(result.title).toEqual('Task with default completion status');
    expect(result.description).toEqual('Testing default values');
    expect(result.is_completed).toEqual(false); // Should use Zod default
    expect(result.id).toBeDefined();
  });

  it('should generate unique IDs for multiple tasks', async () => {
    const task1 = await createTask(basicTaskInput);
    const task2 = await createTask(completedTaskInput);
    const task3 = await createTask(nullDescriptionInput);

    expect(task1.id).not.toEqual(task2.id);
    expect(task2.id).not.toEqual(task3.id);
    expect(task1.id).not.toEqual(task3.id);

    // Verify all tasks are in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(3);
    
    const ids = allTasks.map(task => task.id);
    expect(ids).toContain(task1.id);
    expect(ids).toContain(task2.id);
    expect(ids).toContain(task3.id);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTask(basicTaskInput);
    const afterCreation = new Date();

    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);
    expect(result.updated_at >= beforeCreation).toBe(true);
    expect(result.updated_at <= afterCreation).toBe(true);
    
    // For new tasks, created_at and updated_at should be very close
    const timeDifference = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDifference).toBeLessThan(1000); // Less than 1 second difference
  });
});