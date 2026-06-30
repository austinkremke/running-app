import { useCallback, useEffect, useState } from 'react';

import type { FeedTab, Run } from '../mock';
import { useAuth } from '../context';
import { fetchFeedPosts } from '../services/feedService';
import { toggleFeedLike } from '../services/feedEngagementService';

export function useFeed(activeTab: FeedTab) {
  const { session } = useAuth();
  const viewerUserId = session?.user?.id ?? null;
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const posts = await fetchFeedPosts(activeTab, viewerUserId);
      setRuns(posts);
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load feed.';
      setError(message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, viewerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (likingPostId) {
        return;
      }

      const current = runs.find((run) => run.id === postId);
      if (!current) {
        return;
      }

      const wasLiked = current.likedByMe;
      const optimisticLikes = Math.max(0, current.likes + (wasLiked ? -1 : 1));

      setRuns((previous) =>
        previous.map((run) =>
          run.id === postId
            ? { ...run, likedByMe: !wasLiked, likes: optimisticLikes }
            : run,
        ),
      );

      setLikingPostId(postId);
      try {
        await toggleFeedLike(postId, wasLiked);
      } catch (likeError) {
        setRuns((previous) =>
          previous.map((run) =>
            run.id === postId
              ? { ...run, likedByMe: wasLiked, likes: current.likes }
              : run,
          ),
        );
        throw likeError;
      } finally {
        setLikingPostId(null);
      }
    },
    [likingPostId, runs],
  );

  const bumpCommentCount = useCallback((postId: string) => {
    setRuns((previous) =>
      previous.map((run) =>
        run.id === postId ? { ...run, comments: run.comments + 1 } : run,
      ),
    );
  }, []);

  return { runs, loading, error, refresh, toggleLike, bumpCommentCount, likingPostId };
}
