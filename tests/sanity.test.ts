import { describe, it, expect } from 'vitest';

describe('Scaffold Sanity', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have correct environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
