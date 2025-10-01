import { cn, formatPrice, formatDate, formatCount, slugify, truncateText } from '@/lib/utils';

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

  describe('formatPrice function', () => {
    it('formats prices correctly', () => {
      expect(formatPrice(100)).toBe('$100.00');
      expect(formatPrice(99.99)).toBe('$99.99');
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('handles negative prices', () => {
      expect(formatPrice(-50)).toBe('-$50.00');
    });

    it('handles large numbers', () => {
      expect(formatPrice(1000000)).toBe('$1,000,000.00');
    });

    it('handles decimal precision', () => {
      expect(formatPrice(123.456)).toBe('$123.46');
    });
  });

  describe('formatDate function', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('handles different date formats', () => {
      const date = new Date('2024-12-25T00:00:00Z');
      expect(formatDate(date)).toBe('Dec 25, 2024');
    });

    it('handles invalid dates', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('formatCount function', () => {
    it('formats small numbers', () => {
      expect(formatCount(5)).toBe('5');
      expect(formatCount(99)).toBe('99');
    });

    it('formats thousands', () => {
      expect(formatCount(1000)).toBe('1.0K');
      expect(formatCount(1500)).toBe('1.5K');
      expect(formatCount(9999)).toBe('10.0K');
    });

    it('formats millions', () => {
      expect(formatCount(1000000)).toBe('1.0M');
      expect(formatCount(1500000)).toBe('1.5M');
      expect(formatCount(9999999)).toBe('10.0M');
    });

    it('formats billions', () => {
      expect(formatCount(1000000000)).toBe('1.0B');
      expect(formatCount(1500000000)).toBe('1.5B');
    });

    it('handles zero', () => {
      expect(formatCount(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatCount(-1000)).toBe('-1.0K');
    });
  });

  describe('slugify function', () => {
    it('converts text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test Product Name')).toBe('test-product-name');
    });

    it('handles special characters', () => {
      expect(slugify('Product @#$% Name!')).toBe('product-name');
      expect(slugify('Test & More')).toBe('test-more');
    });

    it('handles multiple spaces', () => {
      expect(slugify('Multiple    Spaces')).toBe('multiple-spaces');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles numbers', () => {
      expect(slugify('Product 123')).toBe('product-123');
    });
  });

  describe('truncateText function', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('returns original text if shorter than limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('handles custom suffix', () => {
      const longText = 'This is a very long text';
      expect(truncateText(longText, 10, '---')).toBe('This is a---');
    });

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('handles zero length', () => {
      expect(truncateText('Hello', 0)).toBe('...');
    });
  });
});


