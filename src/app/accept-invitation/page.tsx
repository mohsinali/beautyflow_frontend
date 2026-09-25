import type { Metadata } from 'next';
import { InvitationContent } from '@/features/auth/invitation-content';

export const metadata: Metadata = { title: 'Accept Invitation' };

export default function AcceptInvitationPage() {
  return <InvitationContent />;
}
