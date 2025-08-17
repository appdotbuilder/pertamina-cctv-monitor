import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable).values([
      {
        title: 'First Task',
        description: 'First task description',
        is_completed: false
      },
      {
        title: 'Second Task', 
        description: null,
        is_completed: true
      },
      {
        title: 'Third Task',
        description: 'Third task description',
        is_completed: false
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Check that all our test tasks are returned
    const titles = result.map(task => task.title);
    expect(titles).toContain('First Task');
    expect(titles).toContain('Second Task');
    expect(titles).toContain('Third Task');

    // Verify task structure separately to avoid interference
    result.forEach(task => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('description');
      expect(task).toHaveProperty('is_completed');
      expect(task).toHaveProperty('created_at');
      expect(task).toHaveProperty('updated_at');
      
      expect(typeof task.id).toBe('number');
      expect(typeof task.title).toBe('string');
      expect(typeof task.is_completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle tasks with null descriptions', async () => {
    await db.insert(tasksTable).values({
      title: 'Task with null description',
      description: null,
      is_completed: false
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].is_completed).toBe(false);
  });

  it('should return tasks ordered by created_at descending (newest first)', async () => {
    // Create tasks with small delays to ensure different timestamps
    await db.insert(tasksTable).values({
      title: 'Oldest Task',
      description: 'Created first',
      is_completed: false
    }).execute();

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Middle Task',
      description: 'Created second',
      is_completed: false
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Newest Task',
      description: 'Created last',
      is_completed: false
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest should come first
    expect(result[0].title).toEqual('Newest Task');
    expect(result[1].title).toEqual('Middle Task');
    expect(result[2].title).toEqual('Oldest Task');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle mixed completion statuses', async () => {
    await db.insert(tasksTable).values([
      {
        title: 'Completed Task',
        description: 'This is done',
        is_completed: true
      },
      {
        title: 'Incomplete Task',
        description: 'This is not done',
        is_completed: false
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const completedTask = result.find(task => task.is_completed === true);
    const incompleteTask = result.find(task => task.is_completed === false);

    expect(completedTask).toBeDefined();
    expect(completedTask?.title).toEqual('Completed Task');
    expect(incompleteTask).toBeDefined();
    expect(incompleteTask?.title).toEqual('Incomplete Task');
  });
});