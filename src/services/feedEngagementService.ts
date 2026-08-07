import type { FeedComment } from '../mock';
import type { Tables } from '../types/database';
import { toContentFilterFriendlyError } from './contentFilterError';
import { supabase } from './supabase';
import { formatRelativeTime } from '../utils/formatRelativeTime';

export type FeedEngagementSummary = {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type ReactionRow = Pick<Tables<'feed_reactions'>, 'post_id' | 'user_id'>;
type CommentCountRow = Pick<Tables<'feed_comments'>, 'post_id'>;

export async function fetchFeedEngagementSummaries(
  postIds: string[],
  viewerUserId: string | null,
): Promise<Record<string, FeedEngagementSummary>> {
  const empty: Record<string, FeedEngagementSummary> = {};
  if (!supabase || postIds.length === 0) {
    return empty;
  }

  const [{ data: reactions, error: reactionsError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase.from('feed_reactions').select('post_id, user_id').in('post_id', postIds),
      supabase.from('feed_comments').select('post_id').in('post_id', postIds),
    ]);

  if (reactionsError) {
    throw reactionsError;
  }
  if (commentsError) {
    throw commentsError;
  }

  for (const postId of postIds) {
    empty[postId] = { likeCount: 0, commentCount: 0, likedByMe: false };
  }

  for (const reaction of (reactions ?? []) as ReactionRow[]) {
    const summary = empty[reaction.post_id];
    if (!summary) {
      continue;
    }
    summary.likeCount += 1;
    if (viewerUserId && reaction.user_id === viewerUserId) {
      summary.likedByMe = true;
    }
  }

  for (const comment of (comments ?? []) as CommentCountRow[]) {
    const summary = empty[comment.post_id];
    if (summary) {
      summary.commentCount += 1;
    }
  }

  return empty;
}

export async function toggleFeedLike(postId: string, liked: boolean): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error('Sign in to like posts.');
  }

  if (liked) {
    const { error } = await supabase
      .from('feed_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    if (error) {
      throw error;
    }
    return;
  }

  const { error } = await supabase.from('feed_reactions').insert({
    post_id: postId,
    user_id: user.id,
    reaction: 'like',
  });

  if (error) {
    throw error;
  }
}

type CommentRow = Tables<'feed_comments'> & {
  profiles: Pick<Tables<'profiles'>, 'display_name' | 'avatar_url'> | null;
};

export async function fetchFeedComments(postId: string): Promise<FeedComment[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .select(
      `
      id,
      post_id,
      user_id,
      body,
      created_at,
      profiles:user_id (display_name, avatar_url)
    `,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const comment = row as CommentRow;
    const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;

    return {
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      authorName: profile?.display_name ?? 'Runner',
      authorAvatarUrl: profile?.avatar_url ?? undefined,
      body: comment.body,
      postedAt: formatRelativeTime(comment.created_at),
    };
  });
}

export async function addFeedComment(postId: string, body: string): Promise<FeedComment> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error('Comment cannot be empty.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error('Sign in to comment.');
  }

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      body: trimmed,
    })
    .select(
      `
      id,
      post_id,
      user_id,
      body,
      created_at,
      profiles:user_id (display_name, avatar_url)
    `,
    )
    .single();

  if (error) {
    throw toContentFilterFriendlyError(error);
  }

  const comment = data as CommentRow;
  const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;

  return {
    id: comment.id,
    postId: comment.post_id,
    userId: comment.user_id,
    authorName: profile?.display_name ?? 'Runner',
    authorAvatarUrl: profile?.avatar_url ?? undefined,
    body: comment.body,
    postedAt: 'just now',
  };
}
