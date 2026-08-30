import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser } from '../api/hooks/useAuth'

const ROLE_HOME = {
  DONOR: '/donor',
  TRUST: '/trust',
  VOLUNTEER: '/volunteer-info',
  ADMIN: '/admin',
}

export function RequireAuth() {
  const token = localStorage.getItem('careconnect_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export function RequireRole({ role }) {
  const user = getStoredUser()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }
  return <Outlet />
}

