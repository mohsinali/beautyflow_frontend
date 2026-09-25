import { z } from 'zod';

export interface ProviderValidationMessages {
  emailRequired: string;
  emailInvalid: string;
  nameRequired: string;
  nameTooLong: string;
  phoneTooLong: string;
  jobTitleTooLong: string;
  bioTooLong: string;
}

export const providerSchema = (messages: ProviderValidationMessages, creating: boolean) =>
  z
    .object({
      email: z.string().trim(),
      displayName: z.string().trim().min(1, messages.nameRequired).max(160, messages.nameTooLong),
      phone: z.string().trim().max(50, messages.phoneTooLong),
      jobTitle: z.string().trim().max(120, messages.jobTitleTooLong),
      bio: z.string().trim().max(2000, messages.bioTooLong),
      isActive: z.boolean(),
    })
    .superRefine((value, context) => {
      if (creating && !value.email)
        context.addIssue({
          code: 'custom',
          path: ['email'],
          message: messages.emailRequired,
        });
      else if (creating && !z.email().safeParse(value.email).success)
        context.addIssue({ code: 'custom', path: ['email'], message: messages.emailInvalid });
    });

export type ProviderFormValues = z.infer<ReturnType<typeof providerSchema>>;
