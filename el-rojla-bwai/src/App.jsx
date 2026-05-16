import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Discover from './pages/Discover'
import ProgrammeDetail from './pages/Programme'
import Apply from './pages/Apply'
import Dashboard from './pages/dashboard/Dashboard'
import CreateProgramme from './pages/dashboard/CreateProgramme'
import ApplicantsManager from './pages/dashboard/ApplicantsManager'
import Matching from './pages/dashboard/Matching'
import Analytics from './pages/dashboard/Analytics'
import ParticipantPortal from './pages/portal/ParticipantPortal'
import MentorPortal from './pages/portal/MentorPortal'

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-light">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/auth/login" />
  }
  
  return children
}

// Temporary placeholders for missing pages
const Placeholder = ({ name }) => (
  <div className="min-h-screen flex items-center justify-center">
    <h1 className="text-2xl font-bold">{name} Page (Coming soon)</h1>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          
          <Route path="/discover" element={<Discover />} />
          <Route path="/programme/:id" element={<ProgrammeDetail />} />
          <Route path="/programme/:id/apply" element={<Apply />} />

          {/* Protected Routes - Organizer */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/create" element={<ProtectedRoute><CreateProgramme /></ProtectedRoute>} />
          <Route path="/dashboard/programme/:id/applicants" element={<ProtectedRoute><ApplicantsManager /></ProtectedRoute>} />
          <Route path="/dashboard/programme/:id/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
          <Route path="/dashboard/programme/:id/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          {/* Protected Routes - Portals */}
          <Route path="/portal/participant" element={<ProtectedRoute><ParticipantPortal /></ProtectedRoute>} />
          <Route path="/portal/mentor" element={<ProtectedRoute><MentorPortal /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
