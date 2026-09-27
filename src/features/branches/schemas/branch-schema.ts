import { z } from 'zod';

export const branchSchema = (messages: {
  nameRequired: string;
  nameTooLong: string;
  timezoneRequired: string;
  addressTooLong: string;
  phoneTooLong: string;
}) =>
  z.object({
    name: z.string().trim().min(1, messages.nameRequired).max(120, messages.nameTooLong),
    timezone: z.string().min(1, messages.timezoneRequired),
    address: z.string().trim().max(250, messages.addressTooLong),
    phone: z.string().trim().max(50, messages.phoneTooLong),
  });

export type BranchFormValues = z.infer<ReturnType<typeof branchSchema>>;
