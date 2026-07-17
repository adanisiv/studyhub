import { useInfiniteQuery } from '@tanstack/react-query';
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
