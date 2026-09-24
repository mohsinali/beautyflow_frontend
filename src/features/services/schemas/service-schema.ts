import { z } from 'zod';

export interface ServiceFormValues {
  categoryId: string;
  name: string;
  description: string;
  code: string;
  defaultPrice: string;
  durationMinutes: string;
  sortOrder: string;
}

export interface ServiceValidationMessages {
  categoryRequired: string;
  nameRequired: string;
  nameTooLong: string;
  descriptionTooLong: string;
  codeInvalid: string;
  priceInvalid: string;
  durationInvalid: string;
  sortOrderInvalid: string;
}

export function serviceSchema(messages: ServiceValidationMessages) {
  return z.object({
    categoryId: z.string().uuid(messages.categoryRequired),
    name: z.string().trim().min(1, messages.nameRequired).max(160, messages.nameTooLong),
    description: z.string().trim().max(2000, messages.descriptionTooLong),
    code: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[\p{L}\p{N}_.-]{1,50}$/u.test(value),
        messages.codeInvalid,
      ),
    defaultPrice: z
      .string()
      .trim()
      .refine((value) => /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value), messages.priceInvalid),
    durationMinutes: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10080),
        messages.durationInvalid,
      ),
    sortOrder: z
      .string()
      .trim()
      .refine(
        (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)),
        messages.sortOrderInvalid,
      ),
  });
}
