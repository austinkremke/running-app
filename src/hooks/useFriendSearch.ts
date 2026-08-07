import { useEffect, useRef, useState } from 'react';

import { useBlockedUsers } from '../context';
import { searchProfiles, type FriendSearchResult } from '../services/friendService';
import { fetchRankTiers } from '../services/rank';
import { mapRankTierRow } from '../services/rank/tierFromRating';
import type { ResolvedRankTier } from '../types/rank';

const SEARCH_DEBOUNCE_MS = 300;

export function useFriendSearch(viewerUserId: string | null, enabled: boolean) {
  const { blockedIds } = useBlockedUsers();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankTiers, setRankTiers] = useState<ResolvedRankTier[]>([]);

  useEffect(() => {
    if (enabled) {
      return;
    }

    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    fetchRankTiers()
      .then((tiers) => {
        if (!cancelled) {
          setRankTiers(tiers.map(mapRankTierRow));
        }
      })
      .catch((tierError) => {
        console.warn('Failed to load rank tiers for friend search', tierError);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const rankTiersRef = useRef(rankTiers);
  rankTiersRef.current = rankTiers;

  useEffect(() => {
    if (!enabled || !viewerUserId) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      void searchProfiles(trimmed, viewerUserId, rankTiersRef.current, 20, blockedIds)
        .then((next) => {
          setResults(next);
        })
        .catch((searchError) => {
          setResults([]);
          setError(
            searchError instanceof Error ? searchError.message : 'Could not search runners.',
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [enabled, query, viewerUserId, blockedIds]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}
