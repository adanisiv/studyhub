import { useInfiniteQuery } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';

// Infinite-scroll feed — each page returns { posts, total, page, pages }
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) =>
      API.get(`/posts/feed?page=${pageParam}&limit=15`).then(r => r.data),
    getNextPageParam: last => (last.page < last.pages ? last.page + 1 : undefined),
    staleTime: 30_000,
  });
}

export function useTrending() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: () => API.get('/stats/trending').then(r => r.data),
    staleTime: 60_000,
  });
}

export function useSuggestedFriends(userId) {
  return useQuery({
    queryKey: ['suggested-friends', userId],
    queryFn: () => API.get('/users/suggested').then(r => r.data),
    staleTime: 120_000,
    enabled: !!userId,
  });
}
