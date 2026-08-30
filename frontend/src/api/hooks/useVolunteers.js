import { useQuery } from '@tanstack/react-query'
import api from '../axios'

export function useMyVolunteerProfile() {
  return useQuery({
    queryKey: ['myVolunteerProfile'],
    queryFn: async () => {
      const { data } = await api.get('/volunteers/me')
      return data.volunteerProfile
    },
  })
}
