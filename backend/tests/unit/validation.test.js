/**
 * AURA Backend — Validation Unit Tests
 *
 * Tests Joi schemas for input validation.
 */

const Joi = require('joi');

describe('Input Validation Schemas', () => {
  // ─── Create Task Schema ────────────────────────────────────────────

  const createTaskSchema = Joi.object({
    goal: Joi.string().min(1).max(1000).required(),
  });

  describe('Create Task', () => {
    test('accepts valid goal', () => {
      const { error } = createTaskSchema.validate({ goal: 'Check the weather in Chennai' });
      expect(error).toBeUndefined();
    });

    test('rejects empty goal', () => {
      const { error } = createTaskSchema.validate({ goal: '' });
      expect(error).toBeDefined();
    });

    test('rejects missing goal', () => {
      const { error } = createTaskSchema.validate({});
      expect(error).toBeDefined();
    });

    test('rejects goal over 1000 characters', () => {
      const { error } = createTaskSchema.validate({ goal: 'x'.repeat(1001) });
      expect(error).toBeDefined();
    });

    test('accepts goal at max length (1000)', () => {
      const { error } = createTaskSchema.validate({ goal: 'x'.repeat(1000) });
      expect(error).toBeUndefined();
    });

    test('strips unknown fields', () => {
      const { value } = createTaskSchema.validate(
        { goal: 'test', extra: 'field' },
        { stripUnknown: true }
      );
      expect(value.extra).toBeUndefined();
      expect(value.goal).toBe('test');
    });
  });

  // ─── UUID Param Schema ─────────────────────────────────────────────

  const uuidParamSchema = Joi.object({
    taskId: Joi.string().uuid().required(),
  });

  describe('UUID Param (taskId)', () => {
    test('accepts valid UUID', () => {
      const { error } = uuidParamSchema.validate({
        taskId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(error).toBeUndefined();
    });

    test('rejects invalid UUID', () => {
      const { error } = uuidParamSchema.validate({ taskId: 'not-a-uuid' });
      expect(error).toBeDefined();
    });

    test('rejects empty string', () => {
      const { error } = uuidParamSchema.validate({ taskId: '' });
      expect(error).toBeDefined();
    });
  });

  // ─── Approval Decision Schema ──────────────────────────────────────

  const approveSchema = Joi.object({
    stepIndex: Joi.number().integer().min(0).required(),
    decision: Joi.string().valid('APPROVED', 'REJECTED').required(),
    reason: Joi.string().max(500).optional().allow('', null),
  });

  describe('Approval Decision', () => {
    test('accepts APPROVED decision', () => {
      const { error } = approveSchema.validate({
        stepIndex: 0,
        decision: 'APPROVED',
      });
      expect(error).toBeUndefined();
    });

    test('accepts REJECTED decision with reason', () => {
      const { error } = approveSchema.validate({
        stepIndex: 2,
        decision: 'REJECTED',
        reason: 'Too risky',
      });
      expect(error).toBeUndefined();
    });

    test('rejects invalid decision value', () => {
      const { error } = approveSchema.validate({
        stepIndex: 0,
        decision: 'MAYBE',
      });
      expect(error).toBeDefined();
    });

    test('rejects negative stepIndex', () => {
      const { error } = approveSchema.validate({
        stepIndex: -1,
        decision: 'APPROVED',
      });
      expect(error).toBeDefined();
    });

    test('rejects missing decision', () => {
      const { error } = approveSchema.validate({ stepIndex: 0 });
      expect(error).toBeDefined();
    });
  });

  // ─── Pagination Schema ────────────────────────────────────────────

  const paginationSchema = Joi.object({
    status: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
  });

  describe('Pagination', () => {
    test('accepts defaults', () => {
      const { value, error } = paginationSchema.validate({});
      expect(error).toBeUndefined();
      expect(value.limit).toBe(20);
      expect(value.offset).toBe(0);
    });

    test('accepts custom limit and offset', () => {
      const { value, error } = paginationSchema.validate({ limit: 50, offset: 10 });
      expect(error).toBeUndefined();
      expect(value.limit).toBe(50);
      expect(value.offset).toBe(10);
    });

    test('rejects limit over 100', () => {
      const { error } = paginationSchema.validate({ limit: 200 });
      expect(error).toBeDefined();
    });

    test('rejects negative offset', () => {
      const { error } = paginationSchema.validate({ offset: -1 });
      expect(error).toBeDefined();
    });

    test('accepts optional status filter', () => {
      const { value, error } = paginationSchema.validate({ status: 'COMPLETED' });
      expect(error).toBeUndefined();
      expect(value.status).toBe('COMPLETED');
    });
  });
});
