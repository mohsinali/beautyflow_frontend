import { z } from 'zod';

export interface ProviderValidationMessages {
  membershipRequired: string;
  nameRequired: string;
  nameTooLong: string;
  phoneTooLong: string;
  jobTitleTooLong: string;
  bioTooLong: string;
}

export const providerSchema = (messages: ProviderValidationMessages) =>
  z
    .object({
      membershipId: z.string(),
      displayName: z.string().trim().min(1, messages.nameRequired).max(160, messages.nameTooLong),
      phone: z.string().trim().max(50, messages.phoneTooLong),
      jobTitle: z.string().trim().max(120, messages.jobTitleTooLong),
      bio: z.string().trim().max(2000, messages.bioTooLong),
    })
    .superRefine((value, context) => {
      if (!value.membershipId)
        context.addIssue({
          code: 'custom',
          path: ['membershipId'],
          message: messages.membershipRequired,
        });
    });

export type ProviderFormValues = z.infer<ReturnType<typeof providerSchema>>;
