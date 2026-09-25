import { z } from 'zod';
export const customerSchema = (messages: {
  nameRequired: string;
  nameTooLong: string;
  phoneInvalid: string;
  notesTooLong: string;
}) =>
  z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(160, messages.nameTooLong),
    phone: z
      .string()
      .trim()
      .max(50, messages.phoneInvalid)
      .refine((value) => !value || /^\+?[0-9\s().-]*$/.test(value), messages.phoneInvalid),
    preferredBranchId: z.string(),
    notes: z.string().trim().max(2000, messages.notesTooLong),
  });
export type CustomerFormValues = z.infer<ReturnType<typeof customerSchema>>;
