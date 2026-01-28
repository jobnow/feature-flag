import { evaluateFlag, EvaluationContext } from './evaluate';
import { SnapshotData } from '../runtime.service';

describe('evaluateFlag', () => {
  const createFlag = (overrides: any = {}) => ({
    id: 'flag-1',
    key: 'test-flag',
    type: 'boolean',
    enabled: true,
    defaultValueJson: 'false',
    rolloutPercent: null,
    ...overrides,
  });

  const createSnapshot = (overrides: Partial<SnapshotData> = {}): SnapshotData => ({
    flags: [],
    segments: [],
    overrides: [],
    ...overrides,
  });

  describe('disabled flag', () => {
    it('should return defaultValue when flag is disabled', () => {
      const flag = createFlag({ enabled: false, defaultValueJson: 'true' });
      const context: EvaluationContext = { userId: 'user123' };
      const snapshot = createSnapshot();

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(true);
      expect(result.source).toBe('disabled');
    });

    it('should return false for boolean when disabled and defaultValue is false', () => {
      const flag = createFlag({ enabled: false, defaultValueJson: 'false' });
      const context: EvaluationContext = {};
      const snapshot = createSnapshot();

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(false);
      expect(result.source).toBe('disabled');
    });
  });

  describe('segment override', () => {
    it('should return override value when user is in segment', () => {
      const flag = createFlag({ defaultValueJson: 'false' });
      const context: EvaluationContext = { userId: 'user123' };
      const snapshot = createSnapshot({
        segments: [
          {
            id: 'segment-1',
            key: 'beta-users',
            userIds: ['user123'],
          },
        ],
        overrides: [
          {
            flagId: 'flag-1',
            segmentId: 'segment-1',
            valueJson: 'true',
          },
        ],
      });

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(true);
      expect(result.source).toBe('segment');
    });

    it('should not return override when user is not in segment', () => {
      const flag = createFlag({ defaultValueJson: 'false' });
      const context: EvaluationContext = { userId: 'user456' };
      const snapshot = createSnapshot({
        segments: [
          {
            id: 'segment-1',
            key: 'beta-users',
            userIds: ['user123'],
          },
        ],
        overrides: [
          {
            flagId: 'flag-1',
            segmentId: 'segment-1',
            valueJson: 'true',
          },
        ],
      });

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(false);
      expect(result.source).toBe('default');
    });

    it('should prioritize segment override over rollout', () => {
      const flag = createFlag({
        defaultValueJson: 'false',
        rolloutPercent: 100, // 100% rollout
      });
      const context: EvaluationContext = { userId: 'user123' };
      const snapshot = createSnapshot({
        segments: [
          {
            id: 'segment-1',
            key: 'beta-users',
            userIds: ['user123'],
          },
        ],
        overrides: [
          {
            flagId: 'flag-1',
            segmentId: 'segment-1',
            valueJson: 'false', // Override desativa mesmo com 100% rollout
          },
        ],
      });

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(false);
      expect(result.source).toBe('segment');
    });
  });

  describe('rollout', () => {
    it('should return rollout value when user bucket is within rolloutPercent', () => {
      const flag = createFlag({
        defaultValueJson: 'false',
        rolloutPercent: 50,
      });
      const context: EvaluationContext = { userId: 'user123' };
      const snapshot = createSnapshot();

      const result = evaluateFlag(flag, context, snapshot);

      // O valor depende do bucket do usuário (determinístico)
      expect(['rollout', 'default']).toContain(result.source);
      if (result.source === 'rollout') {
        expect(result.value).toBe(true); // Rollout ativa para boolean
      }
    });

    it('should not apply rollout when userId is not provided', () => {
      const flag = createFlag({
        defaultValueJson: 'false',
        rolloutPercent: 100,
      });
      const context: EvaluationContext = {}; // Sem userId
      const snapshot = createSnapshot();

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(false);
      expect(result.source).toBe('default');
    });

    it('should be deterministic for same userId and flagKey', () => {
      const flag = createFlag({
        defaultValueJson: 'false',
        rolloutPercent: 50,
      });
      const context: EvaluationContext = { userId: 'user123' };
      const snapshot = createSnapshot();

      const result1 = evaluateFlag(flag, context, snapshot);
      const result2 = evaluateFlag(flag, context, snapshot);

      expect(result1.value).toBe(result2.value);
      expect(result1.source).toBe(result2.source);
    });
  });

  describe('default value', () => {
    it('should return defaultValue when no override or rollout applies', () => {
      const flag = createFlag({ defaultValueJson: 'true' });
      const context: EvaluationContext = { userId: 'user123' };
      const snapshot = createSnapshot();

      const result = evaluateFlag(flag, context, snapshot);

      expect(result.value).toBe(true);
      expect(result.source).toBe('default');
    });

    it('should handle different types', () => {
      const stringFlag = createFlag({
        type: 'string',
        defaultValueJson: '"hello"',
      });
      const numberFlag = createFlag({
        type: 'number',
        defaultValueJson: '42',
      });
      const jsonFlag = createFlag({
        type: 'json',
        defaultValueJson: '{"key":"value"}',
      });

      const context: EvaluationContext = {};
      const snapshot = createSnapshot();

      expect(evaluateFlag(stringFlag, context, snapshot).value).toBe('hello');
      expect(evaluateFlag(numberFlag, context, snapshot).value).toBe(42);
      expect(evaluateFlag(jsonFlag, context, snapshot).value).toEqual({ key: 'value' });
    });
  });
});
