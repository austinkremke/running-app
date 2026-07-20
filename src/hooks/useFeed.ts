import { useCallback, useEffect, useState } from 'react';

import type { FeedTab, Run, SoloMatchFeedPost, TeamMatchFeedPost } from '../mock';
import { useAuth } from '../context';
import { fetchFeedPosts } from '../services/feedService';
import { fetchSoloMatchFeedPosts, fetchTeamMatchFeedPosts } from '../services/matchService';
import { toggleFeedLike } from '../services/feedEngagementService';

export type FeedItem =
  | { kind: 'run'; id: string; sortKey: string; run: Run }
  | { kind: 'match'; id: string; sortKey: string; post: TeamMatchFeedPost }
  | { kind: 'soloMatch'; id: string; sortKey: string; post: SoloMatchFeedPost };

function toFeedItems(
  runs: Run[],
  matchPosts: TeamMatchFeedPost[],
  soloMatchPosts: SoloMatchFeedPost[],
): FeedItem[] {
  const items: FeedItem[] = [
    ...runs.map((run): FeedItem => ({ kind: 'run', id: run.id, sortKey: run.postedAtIso ?? '', run })),
    ...matchPosts.map((post): FeedItem => ({
      kind: 'match',
      id: post.id,
      sortKey: post.postedAtIso,
      post,
    })),
    ...soloMatchPosts.map((post): FeedItem => ({
      kind: 'soloMatch',
      id: post.id,
      sortKey: post.postedAtIso,
      post,
    })),
  ];

  return items.sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
}

export function useFeed(activeTab: FeedTab) {
  const { session } = useAuth();
  const viewerUserId = session?.user?.id ?? null;
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likingPostId, setLikingPostId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [runs, matchPosts, soloMatchPosts] = await Promise.all([
        fetchFeedPosts(activeTab, viewerUserId),
        fetchTeamMatchFeedPosts(viewerUserId),
        fetchSoloMatchFeedPosts(viewerUserId),
      ]);
      setItems(toFeedItems(runs, matchPosts, soloMatchPosts));
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : 'Could not load feed.';
      setError(message);
      setItems([]);
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

      const current = items.find((item) => item.id === postId);
      if (!current) {
        return;
      }

      const wasLiked = current.kind === 'run' ? current.run.likedByMe : current.post.likedByMe;
      const currentLikes = current.kind === 'run' ? current.run.likes : current.post.likes;
      const optimisticLikes = Math.max(0, currentLikes + (wasLiked ? -1 : 1));

      function applyLike(item: FeedItem, likedByMe: boolean, likes: number): FeedItem {
        if (item.id !== postId) return item;
        switch (item.kind) {
          case 'run':
            return { ...item, run: { ...item.run, likedByMe, likes } };
          case 'match':
            return { ...item, post: { ...item.post, likedByMe, likes } };
          case 'soloMatch':
            return { ...item, post: { ...item.post, likedByMe, likes } };
        }
      }

      setItems((previous) => previous.map((item) => applyLike(item, !wasLiked, optimisticLikes)));

      setLikingPostId(postId);
      try {
        await toggleFeedLike(postId, wasLiked);
      } catch (likeError) {
        setItems((previous) => previous.map((item) => applyLike(item, wasLiked, currentLikes)));
        throw likeError;
      } finally {
        setLikingPostId(null);
      }
    },
    [likingPostId, items],
  );

  const bumpCommentCount = useCallback((postId: string) => {
    setItems((previous) =>
      previous.map((item): FeedItem => {
        if (item.id !== postId) return item;
        switch (item.kind) {
          case 'run':
            return { ...item, run: { ...item.run, comments: item.run.comments + 1 } };
          case 'match':
            return { ...item, post: { ...item.post, comments: item.post.comments + 1 } };
          case 'soloMatch':
            return { ...item, post: { ...item.post, comments: item.post.comments + 1 } };
        }
      }),
    );
  }, []);

  return { items, loading, error, refresh, toggleLike, bumpCommentCount, likingPostId };
}
