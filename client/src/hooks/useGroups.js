import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../api/axios';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => API.get('/groups').then(r => r.data),
    staleTime: 60_000,
  });
}

export function useGroupsInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['groups'] });
}
