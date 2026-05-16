import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Star, Users, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { generateBriefing } from '../../lib/gemini'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

export default function MentorPortal() {
  const { user } = useAuth()
  const [mentor, setMentor] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  // Session modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 30,
    rating: 5,
    notes: ''
  })

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      // 1. Get mentor profile
      const { data: mnt } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!mnt) {
        setLoading(false)
        return
      }
      setMentor(mnt)

      // 2. Get confirmed matches and participant details
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id, match_reason,
          participants (*)
        `)
        .eq('mentor_id', mnt.id)
        .eq('status', 'confirmed')

      if (matches) {
        // Fetch AI Briefings for each team if not already stored
        // In a real app we'd save this to DB, here we generate it on the fly if needed
        const enrichedMatches = await Promise.all(matches.map(async (m) => {
          const briefing = await generateBriefing(m.participants)
          return { ...m, briefing }
        }))
        setAssignments(enrichedMatches)
      }

    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogSession = async (e) => {
    e.preventDefault()
    if (!selectedMatch) return

    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          match_id: selectedMatch.id,
          logged_by: user.id,
          session_date: newSession.date,
          duration_minutes: parseInt(newSession.duration),
          rating: parseInt(newSession.rating),
          notes: newSession.notes
        })

      if (error) throw error

      setIsModalOpen(false)
      setNewSession({ date: new Date().toISOString().split('T')[0], duration: 30, rating: 5, notes: '' })
      alert('Session logged successfully!') // Quick feedback
    } catch (err) {
      console.error('Failed to log session:', err)
    }
  }

  const openLogModal = (match) => {
    setSelectedMatch(match)
    setIsModalOpen(true)
  }

  if (loading) {
    return <PageWrapper><Navbar /><div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div></PageWrapper>
  }

  if (!mentor) {
    return (
      <PageWrapper>
        <Navbar />
        <div className="container-narrow py-20 text-center">
          <Card className="p-12 border-dashed">
            <h2 className="text-2xl font-bold mb-2">Mentor Profile Not Found</h2>
            <p className="text-text-secondary mb-6">You haven't been registered as a mentor yet. Please ask the organizer to send you an invite link.</p>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Navbar />
      <div className="container-narrow py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mentor Portal</h1>
            <p className="text-text-secondary">Welcome back, {mentor.name}</p>
          </div>
          <Badge variant="teal" className="px-4 py-1.5 text-sm">Active Mentor</Badge>
        </div>

        <h2 className="text-xl font-semibold mb-6">Your Assigned Teams</h2>

        {assignments.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-text-tertiary" size={24} />
            </div>
            <h3 className="text-lg font-medium mb-2">No teams assigned yet</h3>
            <p className="text-text-secondary">You will see your teams here once the organizer confirms the AI matches.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {assignments.map(match => (
              <Card key={match.id} className="overflow-hidden">
                <div className="p-6 bg-white/40 border-b border-glass-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">{match.participants.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">{match.participants.ai_summary}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {match.participants.ai_tags?.map(t => <Badge key={t} variant="purple" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </div>
                  <button onClick={() => openLogModal(match)} className="btn-primary shrink-0 text-sm">
                    <Calendar size={16} /> Log Session
                  </button>
                </div>
                
                <div className="p-6 bg-accent-subtle/50">
                  <div className="flex items-center gap-2 mb-4 text-accent font-semibold">
                    <Zap size={18} /> AI Briefing
                  </div>
                  <ul className="space-y-3">
                    {match.briefing?.bullets?.map((bullet, i) => (
                      <li key={i} className="flex gap-3 text-sm text-text-primary bg-white p-3 rounded-lg shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">{i + 1}</div>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-accent/10 text-xs text-text-secondary">
                    <span className="font-semibold text-accent/80">Match Reason:</span> {match.match_reason}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Log Session with ${selectedMatch?.participants.name}`}>
        <form onSubmit={handleLogSession} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Date</label>
              <input 
                type="date" 
                required 
                value={newSession.date}
                onChange={e => setNewSession({...newSession, date: e.target.value})}
                className="input-glass"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Duration (mins)</label>
              <input 
                type="number" 
                required 
                min="15" step="15"
                value={newSession.duration}
                onChange={e => setNewSession({...newSession, duration: e.target.value})}
                className="input-glass"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Team Evaluation (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewSession({...newSession, rating: star})}
                  className={`p-2 rounded-lg transition-colors ${newSession.rating >= star ? 'text-amber-500 bg-amber-50' : 'text-text-tertiary bg-black/5'}`}
                >
                  <Star size={24} fill={newSession.rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Private Mentor Notes</label>
            <textarea 
              required
              value={newSession.notes}
              onChange={e => setNewSession({...newSession, notes: e.target.value})}
              className="input-glass"
              rows={4}
              placeholder="How is the team progressing? Any concerns?"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4">
            Save Mentor Notes
          </button>
        </form>
      </Modal>
    </PageWrapper>
  )
}
