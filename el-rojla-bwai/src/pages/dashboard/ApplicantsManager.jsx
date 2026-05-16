import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, X, Search, ChevronRight, ChevronLeft, Download, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Drawer } from '../../components/ui/Drawer'

export default function ApplicantsManager() {
  const { id } = useParams()
  const [programme, setProgramme] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filtering and Drawer state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const { data: prog, error: progErr } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', id)
        .single()
      if (progErr) throw progErr
      setProgramme(prog)

      const { data: apps, error: appsErr } = await supabase
        .from('participants')
        .select('*')
        .eq('programme_id', id)
        .order('ai_score', { ascending: false }) // Rank highest score first
      if (appsErr) throw appsErr
      setApplicants(apps || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (participantId, newStatus) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ status: newStatus })
        .eq('id', participantId)

      if (error) throw error
      
      setApplicants(prev => prev.map(a => 
        a.id === participantId ? { ...a, status: newStatus } : a
      ))
      
      if (selectedApplicant?.id === participantId) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus })
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const openApplicantDetails = (app) => {
    setSelectedApplicant(app)
    setIsDrawerOpen(true)
  }

  const getScoreColor = (score) => {
    if (!score) return 'text-text-secondary'
    if (score >= 80) return 'text-green-500 font-bold'
    if (score >= 50) return 'text-amber-500 font-medium'
    return 'text-red-500'
  }

  const filteredApplicants = applicants.filter(a => {
    const matchesSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || 
                          a.ai_summary?.toLowerCase().includes(search.toLowerCase()) ||
                          a.ai_tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Sub-nav for programme dashboard */}
      <div className="bg-white/60 border-b border-glass-border sticky top-16 z-40 backdrop-blur-md">
        <div className="container-full py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-text-secondary hover:text-text-primary">
              <ChevronLeft size={20} />
            </Link>
            <h2 className="font-semibold text-lg">{programme?.title || 'Programme'}</h2>
            <Badge variant="purple">Applicants</Badge>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link to={`/dashboard/programme/${id}/applicants`} className="btn-primary py-1.5 px-4 text-sm whitespace-nowrap">
              Applicants
            </Link>
            <Link to={`/dashboard/programme/${id}/matching`} className="btn-secondary py-1.5 px-4 text-sm whitespace-nowrap bg-white/50 border-none hover:bg-white shadow-sm">
              AI Matching
            </Link>
            <Link to={`/dashboard/programme/${id}/analytics`} className="btn-secondary py-1.5 px-4 text-sm whitespace-nowrap bg-white/50 border-none hover:bg-white shadow-sm">
              Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="container-full py-8">
        <Card className="flex flex-col min-h-[600px]">
          {/* Controls Bar */}
          <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/30 rounded-t-[18px]">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input 
                  type="text"
                  placeholder="Search name, summary, tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-glass pl-9 py-2 w-full text-sm"
                />
              </div>
              <div className="flex bg-black/5 p-1 rounded-lg">
                {['all', 'pending', 'accepted', 'rejected'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      statusFilter === status ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="btn-ghost text-sm gap-2">
              <Download size={16} /> Export CSV
            </button>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full skeleton mb-4" />)}
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
                <Search size={32} className="mb-4 text-text-tertiary" />
                <p>No applicants found matching your filters.</p>
              </div>
            ) : (
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>AI Summary</th>
                    <th>Tags</th>
                    <th>AI Score</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map(app => (
                    <tr key={app.id} className="cursor-pointer" onClick={() => openApplicantDetails(app)}>
                      <td>
                        <div className="font-semibold text-text-primary">{app.name}</div>
                        <div className="text-xs text-text-secondary">{new Date(app.applied_at).toLocaleDateString()}</div>
                      </td>
                      <td className="max-w-xs">
                        <p className="truncate text-sm" title={app.ai_summary}>{app.ai_summary}</p>
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {app.ai_tags?.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="gray" className="text-[10px] py-0.5">{tag}</Badge>
                          ))}
                          {app.ai_tags?.length > 2 && <span className="text-xs text-text-tertiary">+{app.ai_tags.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={`font-medium ${getScoreColor(app.ai_score)}`}>
                          {app.ai_score ? `${app.ai_score}/100` : '-'}
                        </div>
                      </td>
                      <td>
                        <Badge variant={app.status === 'accepted' ? 'green' : app.status === 'rejected' ? 'red' : 'amber'}>
                          {app.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(app.id, 'accepted')}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                title="Accept"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => handleStatusChange(app.id, 'rejected')}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          <ChevronRight size={18} className="text-text-tertiary ml-2" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Applicant Profile">
        {selectedApplicant && (
          <div className="flex flex-col gap-6 pb-20">
            {/* Header */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold">{selectedApplicant.name}</h2>
                <Badge variant={selectedApplicant.status === 'accepted' ? 'green' : selectedApplicant.status === 'rejected' ? 'red' : 'amber'}>
                  {selectedApplicant.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-text-secondary">{selectedApplicant.email}</p>
            </div>

            {/* AI Analysis Block */}
            <div className="p-5 rounded-2xl bg-accent-subtle border border-accent/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-accent flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Gemini AI Analysis
                </h3>
                <div className={`text-xl font-bold ${getScoreColor(selectedApplicant.ai_score)}`}>
                  {selectedApplicant.ai_score}/100
                </div>
              </div>
              <p className="text-sm font-medium mb-4 leading-relaxed">"{selectedApplicant.ai_summary}"</p>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.ai_tags?.map(tag => (
                  <Badge key={tag} variant="purple">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Form Answers */}
            <div>
              <h3 className="font-semibold text-lg border-b border-glass-border pb-2 mb-4">Form Answers</h3>
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-black/5">
                  <div className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Profile Type</div>
                  <div className="font-medium capitalize">{selectedApplicant.profile_type}</div>
                </div>
                
                {selectedApplicant.form_answers && Object.entries(selectedApplicant.form_answers).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-xl bg-black/5">
                    {/* Assuming keys might be IDs, ideally map them back to labels, but displaying as is for demo fallback */}
                    <div className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">
                      Field Answer
                    </div>
                    <div className="font-medium whitespace-pre-wrap">{value.toString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="fixed bottom-0 right-0 w-[480px] max-w-[90vw] p-4 bg-bg-light/90 backdrop-blur-md border-t border-glass-border flex gap-3">
              {selectedApplicant.status !== 'accepted' && (
                <button 
                  onClick={() => handleStatusChange(selectedApplicant.id, 'accepted')}
                  className="btn-primary bg-green-500 hover:bg-green-600 flex-1"
                >
                  Accept
                </button>
              )}
              {selectedApplicant.status !== 'rejected' && (
                <button 
                  onClick={() => handleStatusChange(selectedApplicant.id, 'rejected')}
                  className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex-1"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </PageWrapper>
  )
}
