import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, Award, Clock, ArrowRight, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, accepted: 0, pending: 0 })

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch organizer's programmes
      const { data: progs, error: progsErr } = await supabase
        .from('programmes')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })

      if (progsErr) throw progsErr
      setProgrammes(progs || [])

      // If they have programmes, fetch aggregate participant stats
      if (progs && progs.length > 0) {
        const progIds = progs.map(p => p.id)
        const { data: parts, error: partsErr } = await supabase
          .from('participants')
          .select('status')
          .in('programme_id', progIds)

        if (partsErr) throw partsErr

        if (parts) {
          setStats({
            total: parts.length,
            accepted: parts.filter(p => p.status === 'accepted').length,
            pending: parts.filter(p => p.status === 'pending').length
          })
        }
      }
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProgramme = async (e, id) => {
    e.stopPropagation() // Prevent card click
    
    if (window.confirm("Are you sure you want to delete this programme? All applicants and matches will be lost.")) {
      try {
        const { error } = await supabase
          .from('programmes')
          .delete()
          .eq('id', id)
          
        if (error) throw error
        
        // Remove from local state
        setProgrammes(prev => prev.filter(p => p.id !== id))
      } catch (err) {
        console.error('Failed to delete programme:', err)
        alert('Could not delete programme')
      }
    }
  }

  return (
    <PageWrapper>
      <Navbar />
      <div className="container-wide py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Organizer Dashboard</h1>
            <p className="text-text-secondary">Manage your programmes, applicants, and mentor matching.</p>
          </div>
          <Link to="/dashboard/create" className="btn-primary">
            <Plus size={18} /> Create Programme
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Card className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-accent-subtle text-accent flex items-center justify-center mb-3">
              <Award size={16} />
            </div>
            <div className="stat-value">{programmes.length}</div>
            <div className="stat-label">Total Programmes</div>
          </Card>
          <Card className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
              <Users size={16} />
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Applicants</div>
          </Card>
          <Card className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center mb-3">
              <CheckCircle2 size={16} />
            </div>
            <div className="stat-value">{stats.accepted}</div>
            <div className="stat-label">Accepted</div>
          </Card>
          <Card className="stat-card">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
              <Clock size={16} />
            </div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </Card>
        </div>

        {/* Programmes List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Programmes</h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => <Card key={i} className="h-40 skeleton p-0" />)}
            </div>
          ) : programmes.length === 0 ? (
            <Card className="p-12 text-center flex flex-col items-center border-dashed">
              <div className="w-16 h-16 bg-accent-subtle text-accent rounded-full flex items-center justify-center mb-4">
                <Plus size={24} />
              </div>
              <h3 className="text-lg font-medium mb-2">No programmes yet</h3>
              <p className="text-text-secondary mb-6">Create your first programme to start accepting applications.</p>
              <Link to="/dashboard/create" className="btn-primary">Create Programme</Link>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {programmes.map((p) => (
                <Card key={p.id} className="p-6 flex flex-col group cursor-pointer" onClick={() => navigate(`/dashboard/programme/${p.id}/applicants`)}>
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={p.status === 'open' ? 'green' : p.status === 'draft' ? 'gray' : 'purple'}>
                      {p.status.toUpperCase()}
                    </Badge>
                    <button 
                      onClick={(e) => handleDeleteProgramme(e, p.id)}
                      className="p-2 -mt-2 -mr-2 text-text-tertiary hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete Programme"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">{p.title}</h3>
                  <p className="text-text-secondary text-sm mb-6 line-clamp-2">{p.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-glass-border flex items-center justify-between">
                    <div className="text-sm font-medium text-text-secondary">
                      {p.selection_type === 'ai_selected' ? 'AI Selected' : 'FCFS'}
                    </div>
                    <div className="text-accent text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Manage <ArrowRight size={16} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function CheckCircle2({ size }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
}
