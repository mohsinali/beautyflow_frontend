import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-client';

describe('queryKeys', () => {
  it('includes tenant and active branch identifiers', () => {
    expect(queryKeys.branch('tenant-1', 'branch-2', 'appointments')).toEqual([
      'tenant',
      'tenant-1',
      'branch',
      'branch-2',
      'appointments',
    ]);
  });
});
