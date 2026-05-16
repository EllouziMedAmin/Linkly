import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { Mail, Lock, AlertCircle, User as UserIcon } from 'lucide-react'
import { Logo } from '../../components/ui/Logo'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await signUp(email, password, { name })
      // Supabase auto-logins after signup if email confirmations are off
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper className="justify-center items-center p-6">
      <Link to="/" className="absolute top-8 left-8 text-text-secondary hover:text-text-primary flex items-center gap-2 font-medium">
        ← Back to home
      </Link>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="w-12 h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-text-secondary mt-2">Start managing your programmes with AI</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3 border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary px-1">Full name</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-glass pl-11"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary px-1">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-glass pl-11"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-secondary px-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-glass pl-11"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </Card>
        
        <p className="text-center mt-8 text-text-secondary text-sm">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </PageWrapper>
  )
}
