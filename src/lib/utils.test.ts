import { describe, it, expect } from 'vitest';
import { formatPercentage, getStageColor, getStageLabel, isPrismaError } from './utils';

describe('formatPercentage', () => {
  it('should format whole numbers', () => {
    expect(formatPercentage(50)).toBe('50%');
    expect(formatPercentage(100)).toBe('100%');
    expect(formatPercentage(0)).toBe('0%');
  });

  it('should round decimal values', () => {
    expect(formatPercentage(33.33)).toBe('33%');
    expect(formatPercentage(66.67)).toBe('67%');
    expect(formatPercentage(99.9)).toBe('100%');
    expect(formatPercentage(0.4)).toBe('0%');
    expect(formatPercentage(0.5)).toBe('1%');
  });

  it('should handle edge cases', () => {
    expect(formatPercentage(-10)).toBe('-10%');
    expect(formatPercentage(150)).toBe('150%');
  });
});

describe('getStageColor', () => {
  it('should return correct color classes for each stage', () => {
    expect(getStageColor('specify')).toBe('bg-purple-500/20 text-purple-400 border-purple-500/30');
    expect(getStageColor('plan')).toBe('bg-blue-500/20 text-blue-400 border-blue-500/30');
    expect(getStageColor('tasks')).toBe('bg-yellow-500/20 text-yellow-400 border-yellow-500/30');
    expect(getStageColor('implement')).toBe('bg-orange-500/20 text-orange-400 border-orange-500/30');
    expect(getStageColor('complete')).toBe('bg-green-500/20 text-green-400 border-green-500/30');
  });

  it('should return default gray color for unknown stages', () => {
    expect(getStageColor('unknown')).toBe('bg-gray-500/20 text-gray-400 border-gray-500/30');
    expect(getStageColor('')).toBe('bg-gray-500/20 text-gray-400 border-gray-500/30');
    expect(getStageColor('invalid')).toBe('bg-gray-500/20 text-gray-400 border-gray-500/30');
  });
});

describe('getStageLabel', () => {
  it('should return correct labels for each stage', () => {
    expect(getStageLabel('specify')).toBe('Specify');
    expect(getStageLabel('plan')).toBe('Plan');
    expect(getStageLabel('tasks')).toBe('Tasks');
    expect(getStageLabel('implement')).toBe('Implement');
    expect(getStageLabel('complete')).toBe('Complete');
  });

  it('should return the input for unknown stages', () => {
    expect(getStageLabel('unknown')).toBe('unknown');
    expect(getStageLabel('custom-stage')).toBe('custom-stage');
  });

  it('should handle empty string', () => {
    expect(getStageLabel('')).toBe('');
  });
});

describe('isPrismaError', () => {
  it('should return true for objects with code property', () => {
    expect(isPrismaError({ code: 'P2002' })).toBe(true);
    expect(isPrismaError({ code: 'P2025' })).toBe(true);
    expect(isPrismaError({ code: 'UNKNOWN' })).toBe(true);
  });

  it('should return true when code matches specified value', () => {
    expect(isPrismaError({ code: 'P2002' }, 'P2002')).toBe(true);
    expect(isPrismaError({ code: 'P2025' }, 'P2025')).toBe(true);
  });

  it('should return false when code does not match specified value', () => {
    expect(isPrismaError({ code: 'P2002' }, 'P2025')).toBe(false);
    expect(isPrismaError({ code: 'P2025' }, 'P2002')).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isPrismaError(null)).toBe(false);
    expect(isPrismaError(undefined)).toBe(false);
    expect(isPrismaError('string')).toBe(false);
    expect(isPrismaError(123)).toBe(false);
    expect(isPrismaError(true)).toBe(false);
  });

  it('should return false for objects without code property', () => {
    expect(isPrismaError({})).toBe(false);
    expect(isPrismaError({ message: 'error' })).toBe(false);
    expect(isPrismaError({ error: 'something' })).toBe(false);
  });

  it('should return false for objects with non-string code', () => {
    expect(isPrismaError({ code: 123 })).toBe(false);
    expect(isPrismaError({ code: null })).toBe(false);
    expect(isPrismaError({ code: undefined })).toBe(false);
  });
});
