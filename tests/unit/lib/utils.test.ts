import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null)).toBe('base');
    });

    it('handles empty strings', () => {
      expect(cn('base', '')).toBe('base');
    });

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('handles objects with boolean values', () => {
      expect(cn({ class1: true, class2: false })).toBe('class1');
    });
  });
});


