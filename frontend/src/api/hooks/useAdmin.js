import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../axios'

export function usePendingTrusts() {
  return useQuery({
    queryKey: ['admin', 'pending-trusts'],
    queryFn: async () => {
      const { data } = await api.get('/admin/trusts/pending')
      return data.trusts
    },
  })
}

export function useVerifyTrust() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (trustId) => {
      const { data } = await api.post(`/trusts/${trustId}/verify`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-trusts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats')
      return data
    },
  })
}
