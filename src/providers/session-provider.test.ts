import { describe, expect, it } from 'vitest';
import { isPublicSessionRoute } from './session-provider';

describe('isPublicSessionRoute', () => {
  it.each(['/login', '/accept-invitation'])('allows unauthenticated access to %s', (pathname) => {
    expect(isPublicSessionRoute(pathname)).toBe(true);
  });

  it.each(['/dashboard', '/unauthorized'])('keeps session handling enabled for %s', (pathname) => {
    expect(isPublicSessionRoute(pathname)).toBe(false);
  });
});
