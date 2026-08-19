import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../axios'

function persistSession(data) {
  if (data?.token) {
    localStorage.setItem('careconnect_token', data.token)
  }
  if (data?.user) {
    localStorage.setItem('careconnect_user', JSON.stringify(data.user))
  }
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password })
      return data
    },
    onSuccess: persistSession,
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/auth/register', payload)
      return data
    },
    onSuccess: persistSession,
  })
}

export function useMe() {
  const hasToken = Boolean(localStorage.getItem('careconnect_token'))
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me')
      return data.user
    },
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  })
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('careconnect_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('careconnect_token')
  localStorage.removeItem('careconnect_user')
}
