import { useCallback, useEffect, useState } from 'react';

import type { FeedTab, Run } from '../mock';
import { fetchFeedPosts } from '../services/feedService';

export function useFeed(activeTab: FeedTab) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const posts = await fetchFeedPosts(activeTab);
      setRuns(posts);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load feed.';
      setError(message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { runs, loading, error, refresh };
}
