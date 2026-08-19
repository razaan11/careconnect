import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../axios'

export function useRegisterTrust() {
  return useMutation({
    mutationFn: async ({ orgName, darpanId }) => {
      const { data } = await api.post('/trusts/register', { orgName, darpanId })
      return data
    },
  })
}

export function useMyTrust() {
  return useQuery({
    queryKey: ['myTrust'],
    queryFn: async () => {
      const { data } = await api.get('/trusts/me')
      return data.trust
    },
  })
}

export function useGetNeeds() {
  return useQuery({
    queryKey: ['needs'],
    queryFn: async () => {
      const { data } = await api.get('/trusts/needs')
      return data.needs
    },
  })
}

export function usePostNeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/trusts/needs', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] })
    },
  })
}

export function useDeleteNeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/trusts/needs/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['needs'] })
    },
  })
}

export function useGenerateOTP() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (donationId) => {
      const { data } = await api.post(`/trusts/donations/${donationId}/generate-otp`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}
