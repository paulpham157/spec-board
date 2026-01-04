import { describe, it, expect } from 'vitest';
import {
  isValidCheckboxLine,
  getCheckboxState,
  toggleCheckboxLine,
  toggleCheckboxInContent,
} from './checklist-utils';

describe('checklist-utils', () => {
  describe('isValidCheckboxLine', () => {
    it('returns true for unchecked checkbox', () => {
      expect(isValidCheckboxLine('- [ ] Task item')).toBe(true);
    });

    it('returns true for checked checkbox (lowercase x)', () => {
      expect(isValidCheckboxLine('- [x] Task item')).toBe(true);
    });

    it('returns true for checked checkbox (uppercase X)', () => {
      expect(isValidCheckboxLine('- [X] Task item')).toBe(true);
    });

    it('returns true for checkbox with leading whitespace', () => {
      expect(isValidCheckboxLine('  - [ ] Indented task')).toBe(true);
    });

    it('returns false for regular list item', () => {
      expect(isValidCheckboxLine('- Regular item')).toBe(false);
    });

    it('returns false for heading', () => {
      expect(isValidCheckboxLine('## Section')).toBe(false);
    });

    it('returns false for empty line', () => {
      expect(isValidCheckboxLine('')).toBe(false);
    });

    it('returns false for text without checkbox', () => {
      expect(isValidCheckboxLine('Some text')).toBe(false);
    });
  });

  describe('getCheckboxState', () => {
    it('returns false for unchecked checkbox', () => {
      expect(getCheckboxState('- [ ] Task item')).toBe(false);
    });

    it('returns true for checked checkbox (lowercase x)', () => {
      expect(getCheckboxState('- [x] Task item')).toBe(true);
    });

    it('returns true for checked checkbox (uppercase X)', () => {
      expect(getCheckboxState('- [X] Task item')).toBe(true);
    });

    it('returns null for non-checkbox line', () => {
      expect(getCheckboxState('- Regular item')).toBe(null);
    });

    it('returns null for empty line', () => {
      expect(getCheckboxState('')).toBe(null);
    });
  });

  describe('toggleCheckboxLine', () => {
    it('toggles unchecked to checked', () => {
      expect(toggleCheckboxLine('- [ ] Task item')).toBe('- [x] Task item');
    });

    it('toggles checked (lowercase) to unchecked', () => {
      expect(toggleCheckboxLine('- [x] Task item')).toBe('- [ ] Task item');
    });

    it('toggles checked (uppercase) to unchecked', () => {
      expect(toggleCheckboxLine('- [X] Task item')).toBe('- [ ] Task item');
    });

    it('preserves indentation', () => {
      expect(toggleCheckboxLine('  - [ ] Indented task')).toBe('  - [x] Indented task');
    });

    it('preserves text with special characters', () => {
      expect(toggleCheckboxLine('- [ ] Task with [Tag]')).toBe('- [x] Task with [Tag]');
    });

    it('returns original line for non-checkbox', () => {
      expect(toggleCheckboxLine('- Regular item')).toBe('- Regular item');
    });
  });

  describe('toggleCheckboxInContent', () => {
    const sampleContent = `# Checklist

## Section

- [ ] First item
- [x] Second item
- [ ] Third item

## Notes

- Note item`;

    it('toggles unchecked item to checked', () => {
      const result = toggleCheckboxInContent(sampleContent, 4);
      expect(result.success).toBe(true);
      expect(result.newState).toBe(true);
      expect(result.content).toContain('- [x] First item');
    });

    it('toggles checked item to unchecked', () => {
      const result = toggleCheckboxInContent(sampleContent, 5);
      expect(result.success).toBe(true);
      expect(result.newState).toBe(false);
      expect(result.content).toContain('- [ ] Second item');
    });

    it('fails for out of bounds line index (negative)', () => {
      const result = toggleCheckboxInContent(sampleContent, -1);
      expect(result.success).toBe(false);
      expect(result.error).toContain('out of bounds');
    });

    it('fails for out of bounds line index (too large)', () => {
      const result = toggleCheckboxInContent(sampleContent, 100);
      expect(result.success).toBe(false);
      expect(result.error).toContain('out of bounds');
    });

    it('fails for non-checkbox line', () => {
      const result = toggleCheckboxInContent(sampleContent, 0); // "# Checklist"
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a valid checkbox');
    });

    it('fails for note item (not a checkbox)', () => {
      const result = toggleCheckboxInContent(sampleContent, 10); // "- Note item"
      expect(result.success).toBe(false);
      expect(result.error).toContain('not a valid checkbox');
    });

    it('preserves other lines when toggling', () => {
      const result = toggleCheckboxInContent(sampleContent, 4);
      expect(result.success).toBe(true);
      expect(result.content).toContain('# Checklist');
      expect(result.content).toContain('- [x] Second item');
      expect(result.content).toContain('- [ ] Third item');
      expect(result.content).toContain('- Note item');
    });
  });
});
