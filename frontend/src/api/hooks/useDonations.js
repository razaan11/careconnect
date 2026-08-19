import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../axios'

export function useListDonations() {
  return useQuery({
    queryKey: ['donations'],
    queryFn: async () => {
      const { data } = await api.get('/donations')
      return data.donations
    },
  })
}

export function useBrowseNeeds() {
  return useMutation({
    mutationFn: async ({ pincode, district, state }) => {
      const { data } = await api.get('/donations/browse-needs', {
        params: { pincode, district, state },
      })
      return data
    },
  })
}

export function useCreateDonation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/donations', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useUploadProof() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, files }) => {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('photos', file))
      const { data } = await api.post(`/donations/${id}/photo-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, otp }) => {
      const { data } = await api.post(`/donations/${id}/confirm-delivery`, { otp })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })
}
