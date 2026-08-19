import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth, RequireRole, RoleHomeRedirect } from './components/RouteGuards'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import NotFound from './pages/NotFound'
import VolunteerInfo from './pages/VolunteerInfo'

import DonorDashboard from './pages/donor/Dashboard'
import CreateDonation from './pages/donor/CreateDonation'
import DonationDetail from './pages/donor/DonationDetail'
import BrowseNeeds from './pages/donor/BrowseNeeds'

import TrustDashboard from './pages/trust/Dashboard'
import PostNeed from './pages/trust/PostNeed'
import GenerateOTP from './pages/trust/GenerateOTP'

import AdminDashboard from './pages/admin/Dashboard'
import TrustVerification from './pages/admin/TrustVerification'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<RoleHomeRedirect />} />

        <Route element={<Layout />}>
          <Route path="/volunteer-info" element={<VolunteerInfo />} />

          <Route element={<RequireRole role="DONOR" />}>
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/donor/needs" element={<BrowseNeeds />} />
            <Route path="/donor/new" element={<CreateDonation />} />
            <Route path="/donor/donations/:id" element={<DonationDetail />} />
          </Route>

          <Route element={<RequireRole role="TRUST" />}>
            <Route path="/trust" element={<TrustDashboard />} />
            <Route path="/trust/needs/new" element={<PostNeed />} />
            <Route path="/trust/otp" element={<GenerateOTP />} />
          </Route>

          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/trusts" element={<TrustVerification />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
