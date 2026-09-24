import { z } from 'zod';

export interface BranchServiceFormValues {
  isAvailable: boolean;
  useOverride: boolean;
  priceOverride: string;
}

export function branchServiceSchema(priceInvalid: string) {
  return z
    .object({
      isAvailable: z.boolean(),
      useOverride: z.boolean(),
      priceOverride: z.string().trim(),
    })
    .refine(
      (values) =>
        !values.useOverride || /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(values.priceOverride),
      { path: ['priceOverride'], message: priceInvalid },
    );
}
