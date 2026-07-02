import { useCallback } from 'react';

import { useSoloMatchCompletion } from '../context';

export function useSoloMatchCompletionPrompt() {
  const { syncCompletions } = useSoloMatchCompletion();

  return useCallback(async () => {
    return syncCompletions();
  }, [syncCompletions]);
}
