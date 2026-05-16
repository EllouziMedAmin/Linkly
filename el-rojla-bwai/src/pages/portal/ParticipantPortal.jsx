import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Star, MessageSquare, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { downloadMatchSession } from '../../lib/calendar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'

// ---- Mini Calendar Component ----
function MiniCalendar({ programme, sessions }) {
  const [viewDate, setViewDate] = useState(new Date())
  
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()
  
  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  // Collect marked dates
  const markedDates = {}
  if (programme?.start_date) {
    const d = programme.start_date.substring(0, 10)
    markedDates[d] = { color: '#7F77DD', label: 'Event Day' }
  }
  sessions?.forEach(s => {
    if (s.session_date) {
      const d = s.session_date.substring(0, 10)
      markedDates[d] = { color: '#30D1BC', label: 'Session' }
    }
  })

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  
  // Build grid cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const dateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-black/5 text-text-secondary transition-colors">
          <ChevronLeft size={14} />
        </button>
        <h4 className="text-xs font-semibold text-text-primary tracking-wide">{monthName}</h4>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-black/5 text-text-secondary transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      
      {/* Day names */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[9px] font-medium text-text-tertiary py-1">{d}</div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const ds = dateStr(day)
          const mark = markedDates[ds]
          const todayClass = isToday(day)
          
          return (
            <div key={i} className="flex flex-col items-center py-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                  todayClass 
                    ? 'bg-accent text-white' 
                    : 'text-text-primary hover:bg-black/5'
                }`}
              >
                {day}
              </div>
              {mark && (
                <div 
                  className="w-1 h-1 rounded-full mt-0.5" 
                  style={{ backgroundColor: mark.color }}
                  title={mark.label}
                />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Legend dots */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-glass-border">
        {programme?.start_date && <span className="flex items-center gap-1 text-[9px] text-text-tertiary"><span className="w-1.5 h-1.5 rounded-full bg-[#7F77DD]" />Event Day</span>}
        {sessions?.length > 0 && <span className="flex items-center gap-1 text-[9px] text-text-tertiary"><span className="w-1.5 h-1.5 rounded-full bg-[#30D1BC]" />Session</span>}
      </div>
    </Card>
  )
}

export default function ParticipantPortal() {
  const { user } = useAuth()
  const [participant, setParticipant] = useState(null)
  const [programme, setProgramme] = useState(null)
  const [match, setMatch] = useState(null)
  const [mentor, setMentor] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  // Log session state
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      // 1. Get participant profile
      const { data: part } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!part) {
        setLoading(false)
        return
      }
      setParticipant(part)

      // 2. Get programme
      const { data: prog } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', part.programme_id)
        .single()
      setProgramme(prog)

      // 3. Get confirmed match
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .eq('participant_id', part.id)
        .eq('status', 'confirmed')
        .single()
      
      if (matchData) {
        setMatch(matchData)
        // 4. Get mentor details
        const { data: mentorData } = await supabase
          .from('mentors')
          .select('*')
          .eq('id', matchData.mentor_id)
          .single()
        setMentor(mentorData)

        // 5. Get sessions
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('*')
          .eq('match_id', matchData.id)
          .order('session_date', { ascending: false })
        setSessions(sessionsData || [])
      }

    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogSession = async (e) => {
    e.preventDefault()
    if (!match) return

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          match_id: match.id,
          logged_by: user.id,
          session_date: newSession.date,
          duration_minutes: parseInt(newSession.duration),
          rating: parseInt(newSession.rating),
          notes: newSession.notes
        })
        .select()
        .single()

      if (error) throw error

      setSessions([data, ...sessions])
      setIsModalOpen(false)
      setNewSession({ date: new Date().toISOString().split('T')[0], duration: 30, rating: 5, notes: '' })
    } catch (err) {
      console.error('Failed to log session:', err)
    }
  }

  if (loading) {
    return <PageWrapper><Navbar /><div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div></PageWrapper>
  }

  if (!participant) {
    return (
      <PageWrapper>
        <Navbar />
        <div className="container-narrow py-20 text-center">
          <Card className="p-12">
            <h2 className="text-2xl font-bold mb-2">No Active Applications</h2>
            <p className="text-text-secondary mb-6">You haven't applied to any programmes yet.</p>
            <Link to="/discover" className="btn-primary">Browse Programmes</Link>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Navbar />
      <div className="container-narrow py-12">
        <h1 className="text-3xl font-bold mb-8">Participant Portal</h1>

        <div className="flex flex-col gap-8">
          {/* Status Banner */}
          <Card className={`p-6 border-l-4 ${participant.status === 'accepted' ? 'border-l-green-500' : participant.status === 'rejected' ? 'border-l-red-500' : 'border-l-amber-500'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">{programme?.title}</h2>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <p>Application Status: <span className="font-semibold capitalize">{participant.status}</span></p>
                  {programme && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 font-medium">
                      <Calendar size={14} className="text-accent" /> 
                      {new Date(programme.start_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={participant.status === 'accepted' ? 'green' : participant.status === 'rejected' ? 'red' : 'amber'}>
                {participant.status.toUpperCase()}
              </Badge>
            </div>
          </Card>


          <div className="grid md:grid-cols-3 gap-6">
              {/* Mentor Column */}
              <div className="md:col-span-1 flex flex-col gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 border-b border-glass-border pb-2">Your Assigned Mentor</h3>
                  {mentor ? (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-lg text-accent">{mentor.name}</div>
                        <button 
                          onClick={() => downloadMatchSession(mentor.name, participant.name, programme.title)}
                          className="p-2 rounded-lg bg-accent-subtle text-accent hover:bg-accent/20 transition-colors"
                          title="Schedule Intro Session"
                        >
                          <CalendarPlus size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-text-secondary mt-2 mb-4">{mentor.bio}</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {mentor.expertise_tags?.map(t => <Badge key={t} variant="teal">{t}</Badge>)}
                      </div>
                      <div className="text-sm bg-accent-subtle p-3 rounded-xl border border-accent/20">
                        <span className="font-medium">Why you matched:</span><br/>
                        {match.match_reason}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-text-secondary">
                      <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock size={20} className="text-text-tertiary" />
                      </div>
                      <p className="text-sm">Matching in progress. We'll assign you a mentor soon.</p>
                    </div>
                  )}
                </Card>

                {mentor && (
                  <Card className="p-6 bg-accent text-white border-none">
                    <h3 className="font-semibold mb-2 text-white">Log a Session</h3>
                    <p className="text-white/80 text-sm mb-4">Keep your engagement score high by logging your mentorship sessions.</p>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full bg-white text-accent hover:bg-gray-50">
                      Log Session
                    </button>
                  </Card>
                )}

                {/* Mini Calendar */}
                <MiniCalendar programme={programme} sessions={sessions} />
              </div>

              {/* Sessions Column */}
              <div className="md:col-span-2">
                <Card className="p-6 h-full min-h-[400px]">
                  <h3 className="font-semibold mb-6 border-b border-glass-border pb-2">Session History</h3>
                  
                  {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-text-secondary">
                      <MessageSquare size={32} className="mb-4 text-text-tertiary opacity-50" />
                      <p>No sessions logged yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {sessions.map(s => (
                        <div key={s.id} className="p-4 rounded-xl border border-glass-border bg-white/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 font-medium">
                              <Calendar size={16} className="text-accent" />
                              {new Date(s.session_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 font-medium">
                              <Star size={14} fill="currentColor" /> {s.rating}/5
                            </div>
                          </div>
                          <div className="text-sm text-text-secondary mb-3 flex items-center gap-2">
                            <Clock size={14} /> {s.duration_minutes} minutes
                          </div>
                          {s.notes && (
                            <p className="text-sm bg-white p-3 rounded-lg border border-glass-border">
                              "{s.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Mentorship Session">
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
            <label className="text-sm font-medium">Rating (1-5)</label>
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
            <label className="text-sm font-medium">Key Takeaways / Notes</label>
            <textarea 
              required
              value={newSession.notes}
              onChange={e => setNewSession({...newSession, notes: e.target.value})}
              className="input-glass"
              rows={3}
              placeholder="What did you discuss? What are the next steps?"
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4">
            Save Session
          </button>
        </form>
      </Modal>
    </PageWrapper>
  )
}
