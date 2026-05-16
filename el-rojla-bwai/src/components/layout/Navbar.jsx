import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, User as UserIcon } from 'lucide-react'
import { Logo } from '../ui/Logo'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container-full mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-semibold text-lg tracking-tight">Lyncly</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/discover" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Discover Programmes
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/portal/participant" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                My Portal
              </Link>
              <Link to="/dashboard" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Organizer
              </Link>
              <div className="h-4 w-px bg-glass-border"></div>
              <button 
                onClick={handleSignOut}
                className="btn-ghost flex items-center gap-2"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/auth/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Log in
              </Link>
              <Link to="/auth/signup" className="btn-primary py-2 px-4 text-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
