import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';

export type LinkedProvider = {
  id: string;
  label: string;
  detail?: string;
};

function formatProviderLabel(provider: string): string {
  switch (provider) {
    case 'apple':
      return 'Apple';
    case 'google':
      return 'Google';
    case 'email':
      return 'Email';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

export function getLinkedProviders(session: Session | null): LinkedProvider[] {
  if (!session?.user) {
    return [];
  }

  const providers = new Map<string, LinkedProvider>();

  for (const identity of session.user.identities ?? []) {
    providers.set(identity.provider, {
      id: identity.provider,
      label: formatProviderLabel(identity.provider),
      detail: identity.identity_data?.email as string | undefined,
    });
  }

  if (session.user.email && (session.user.identities ?? []).length === 0) {
    providers.set('email', {
      id: 'email',
      label: 'Email',
      detail: session.user.email,
    });
  }

  return Array.from(providers.values());
}

export async function deleteOwnAccount(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.rpc('delete_own_account');
  if (error) {
    throw error;
  }
}
