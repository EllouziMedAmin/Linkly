import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Brain, TrendingUp, Users, Activity, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateReport } from '../../lib/gemini'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CytoscapeGraph } from '../../components/graph/CytoscapeGraph'

export default function Analytics() {
  const { id } = useParams()
  const [programme, setProgramme] = useState(null)
  const [stats, setStats] = useState({ totalSessions: 0, avgRating: 0, completionRate: 0 })
  const [aiReport, setAiReport] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Graph data
  const [participants, setParticipants] = useState([])
  const [mentors, setMentors] = useState([])
  const [matches, setMatches] = useState([])

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const { data: prog } = await supabase.from('programmes').select('*').eq('id', id).single()
      setProgramme(prog)

      const { data: parts } = await supabase.from('participants').select('*').eq('programme_id', id).eq('status', 'accepted')
      setParticipants(parts || [])

      const { data: mnts } = await supabase.from('mentors').select('*').eq('programme_id', id)
      setMentors(mnts || [])

      const { data: mchs } = await supabase.from('matches').select('*').eq('programme_id', id).eq('status', 'confirmed')
      setMatches(mchs || [])

      if (mchs && mchs.length > 0) {
        const matchIds = mchs.map(m => m.id)
        const { data: sessions } = await supabase.from('sessions').select('*').in('match_id', matchIds)
        
        if (sessions) {
          const total = sessions.length
          const avg = total > 0 ? sessions.reduce((acc, s) => acc + s.rating, 0) / total : 0
          // Mock completion rate based on matches having at least 1 session
          const matchedCount = mchs.length
          const activeMatches = new Set(sessions.map(s => s.match_id)).size
          const completion = matchedCount > 0 ? (activeMatches / matchedCount) * 100 : 0

          setStats({ totalSessions: total, avgRating: avg.toFixed(1), completionRate: Math.round(completion) })
        }
      }
    } catch (err) {
      console.error('Analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const { data: sessions } = await supabase.from('sessions').select('*') // Get all for context
      const report = await generateReport(sessions, matches, participants)
      setAiReport(report)
    } catch (err) {
      console.error('Report generation failed', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  // Generate read-only graph elements
  const graphElements = useMemo(() => {
    const elements = []
    
    // Only show confirmed participants
    participants.filter(p => matches.some(m => m.participant_id === p.id)).forEach(p => {
      elements.push({
        data: { id: p.id, label: p.name, color: '#7F77DD', borderWidth: 0 }
      })
    })

    // Only show active mentors
    mentors.filter(m => matches.some(mt => mt.mentor_id === m.id)).forEach(m => {
      elements.push({
        data: { id: m.id, label: m.name, color: '#30D1BC', borderWidth: 0 }
      })
    })

    matches.forEach(m => {
      elements.push({
        data: {
          id: `${m.participant_id}-${m.mentor_id}`,
          source: m.participant_id,
          target: m.mentor_id,
          width: 2
        }
      })
    })

    return elements
  }, [participants, mentors, matches])

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Sub-nav */}
      <div className="bg-white/60 border-b border-glass-border sticky top-16 z-40 backdrop-blur-md shrink-0">
        <div className="container-full py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-text-secondary hover:text-text-primary">
              <ChevronLeft size={20} />
            </Link>
            <h2 className="font-semibold text-lg">{programme?.title || 'Programme'}</h2>
            <Badge variant="purple">Analytics & Insights</Badge>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link to={`/dashboard/programme/${id}/applicants`} className="btn-secondary py-1.5 px-4 text-sm whitespace-nowrap bg-white/50 border-none hover:bg-white shadow-sm">
              Applicants
            </Link>
            <Link to={`/dashboard/programme/${id}/matching`} className="btn-secondary py-1.5 px-4 text-sm whitespace-nowrap bg-white/50 border-none hover:bg-white shadow-sm">
              AI Matching
            </Link>
            <Link to={`/dashboard/programme/${id}/analytics`} className="btn-primary py-1.5 px-4 text-sm whitespace-nowrap">
              Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="container-full py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Activity size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalSessions}</div>
            <div className="text-sm font-medium text-text-secondary">Total Sessions Logged</div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 flex items-end gap-2">
              {stats.avgRating} <span className="text-sm text-text-tertiary mb-1 font-normal">/ 5.0</span>
            </div>
            <div className="text-sm font-medium text-text-secondary">Average Mentor Rating</div>
          </Card>
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.completionRate}%</div>
            <div className="text-sm font-medium text-text-secondary">Engagement Rate</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ecosystem Graph */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-[600px] flex flex-col">
              <h3 className="font-semibold text-lg mb-4">Ecosystem Network Topology</h3>
              <p className="text-sm text-text-secondary mb-6">Historical view of all confirmed linkages in this cohort.</p>
              <div className="flex-1 relative rounded-xl overflow-hidden">
                {graphElements.length > 0 ? (
                  <CytoscapeGraph elements={graphElements} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-text-tertiary bg-white/50 rounded-xl border border-glass-border">
                    Not enough data to map ecosystem
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-[600px] flex flex-col bg-accent-subtle/30 border-accent/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-accent">
                  <Brain size={20} /> AI Cohort Insights
                </h3>
                {aiReport && (
                  <button className="text-text-tertiary hover:text-accent transition-colors" title="Export PDF">
                    <Download size={18} />
                  </button>
                )}
              </div>

              {!aiReport ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-glass-border flex items-center justify-center mb-4 shadow-sm">
                    <Brain className="text-accent" size={32} />
                  </div>
                  <h4 className="font-medium mb-2">Generate End-of-Programme Report</h4>
                  <p className="text-sm text-text-secondary mb-6 px-4">
                    Gemini will analyze all session logs, ratings, and outcomes to generate reusable insights for your next cohort.
                  </p>
                  <button 
                    onClick={handleGenerateReport} 
                    disabled={generatingReport}
                    className="btn-primary w-full max-w-[200px]"
                  >
                    {generatingReport ? 'Analyzing Data...' : 'Generate Insights'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Executive Summary</h4>
                    <p className="text-sm text-text-primary leading-relaxed bg-white/60 p-3 rounded-lg">{aiReport.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Key Insights</h4>
                    <ul className="space-y-2">
                      {aiReport.insights.map((insight, i) => (
                        <li key={i} className="text-sm flex gap-2 items-start bg-white/60 p-3 rounded-lg">
                          <span className="text-accent mt-0.5">•</span>
                          <span className="leading-relaxed">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Top Mentor Profile</h4>
                    <p className="text-sm text-text-primary leading-relaxed bg-white/60 p-3 rounded-lg">{aiReport.top_mentor_profile}</p>
                  </div>

                  <div className="bg-accent text-white p-4 rounded-xl shadow-glass-sm mt-auto">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Zap size={14} /> Recommendation for Next Cohort
                    </h4>
                    <p className="text-sm font-medium">{aiReport.recommendation}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
