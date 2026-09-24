import { z } from 'zod';

export interface CategoryFormValues {
  name: string;
  description: string;
  color: string;
  iconKey: string;
  sortOrder: number;
}

export interface CategoryValidationMessages {
  nameRequired: string;
  nameTooLong: string;
  descriptionTooLong: string;
  colorInvalid: string;
  iconKeyInvalid: string;
  sortOrderInvalid: string;
}

export function categorySchema(messages: CategoryValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(120, messages.nameTooLong),
    description: z.string().trim().max(1000, messages.descriptionTooLong),
    color: z
      .string()
      .trim()
      .refine((value) => value === '' || /^#[0-9A-Fa-f]{6}$/.test(value), messages.colorInvalid),
    iconKey: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^[A-Za-z0-9_-]{1,50}$/.test(value),
        messages.iconKeyInvalid,
      ),
    sortOrder: z
      .number({ error: messages.sortOrderInvalid })
      .int(messages.sortOrderInvalid)
      .min(0, messages.sortOrderInvalid),
  });
}
