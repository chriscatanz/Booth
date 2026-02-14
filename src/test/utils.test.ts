import { describe, it, expect } from 'vitest';
import { formatCurrency, cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234.56)).toBe('$1,235');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('handles null/undefined', () => {
      expect(formatCurrency(null as unknown as number)).toBe('$0');
      expect(formatCurrency(undefined as unknown as number)).toBe('$0');
    });

    it('formats large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
    });
  });

  describe('cn (classnames utility)', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
    });

    it('handles undefined/null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });
  });
});
