import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../api/axios';

export function useGroup(id) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => API.get(`/groups/${id}`).then(r => r.data),
    staleTime: 60_000,
    enabled: !!id,
  });
}

export function useGroupPosts(id) {
  return useQuery({
    queryKey: ['group-posts', id],
    queryFn: () => API.get(`/posts/group/${id}`).then(r => r.data),
    staleTime: 30_000,
    enabled: !!id,
  });
}

// Returns a helper to refetch both group + posts at once
export function useGroupInvalidate() {
  const qc = useQueryClient();
  return (id) => {
    qc.invalidateQueries({ queryKey: ['group', id] });
    qc.invalidateQueries({ queryKey: ['group-posts', id] });
  };
}
