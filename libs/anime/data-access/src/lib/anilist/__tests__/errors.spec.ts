import { describe, it, expect } from 'vitest';
import { isRateLimitError } from '../errors.js';

describe('isRateLimitError', () => {
  it('true para ClientError com response.status 429', () => {
    expect(isRateLimitError({ response: { status: 429 } })).toBe(true);
  });

  it('true para fetch SSR com status 429', () => {
    expect(isRateLimitError({ status: 429 })).toBe(true);
  });

  it('false para outros status (500)', () => {
    expect(isRateLimitError({ response: { status: 500 } })).toBe(false);
  });

  it('false para Error comum (rede)', () => {
    expect(isRateLimitError(new Error('network down'))).toBe(false);
  });

  it('false para undefined e null', () => {
    expect(isRateLimitError(undefined)).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });

  it('false quando response não tem status 429', () => {
    expect(isRateLimitError({ response: null })).toBe(false);
    expect(isRateLimitError({ response: {} })).toBe(false);
  });
});
