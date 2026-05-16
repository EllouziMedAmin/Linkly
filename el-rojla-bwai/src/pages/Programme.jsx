import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, Users, Target, CheckCircle2, ArrowRight, CalendarPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { downloadProgrammeCalendar, downloadDeadlineReminder } from '../lib/calendar'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export default function ProgrammeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [programme, setProgramme] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgramme()
  }, [id])

  const fetchProgramme = async () => {
    try {
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setProgramme(data)
    } catch (err) {
      console.error('Error fetching programme:', err)
      navigate('/discover')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <Navbar />
        <div className="container-narrow py-20 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  if (!programme) return null

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Banner */}
      {programme.cover_image_url ? (
        <div 
          className="h-64 md:h-80 w-full bg-cover bg-center relative transition-all duration-500"
          style={{ backgroundImage: `url(${programme.cover_image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-bg-light via-bg-light/20 to-transparent" />
        </div>
      ) : (
        <div className="h-12 w-full bg-transparent" />
      )}
      
      <div className={`container-narrow relative z-10 pb-20 ${
        programme.cover_image_url ? '-mt-32' : 'pt-4'
      }`}>
        {/* Main Content */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="gray" className="bg-white/80 backdrop-blur">
                {programme.category}
              </Badge>
              {programme.selection_type === 'ai_selected' ? (
                <Badge variant="purple" className="bg-white/80 backdrop-blur flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  AI Selected
                </Badge>
              ) : (
                <Badge variant="teal" className="bg-white/80 backdrop-blur">
                  First Come First Served
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{programme.title}</h1>
            <p className="text-xl text-text-secondary">{programme.description}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">About the Programme</h3>
              <div className="prose prose-sm prose-p:text-text-secondary max-w-none">
                <p>
                  Join this {programme.category} to accelerate your growth. 
                  {programme.needs_matching && " We use advanced AI to ensure you are matched with the perfect mentors for your specific needs."}
                </p>
                
                <h4 className="text-base font-semibold text-text-primary mt-6 mb-3">Eligibility Requirements</h4>
                <ul className="space-y-2 mb-6">
                  {['Must be a registered entity or dedicated team', 'Commitment to attend all mandatory sessions', 'Willingness to engage with mentors'].map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                      <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Key Details</h3>
                <div className="flex flex-col gap-4 text-sm">
                  {programme.deadline && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="font-medium">Application Deadline</div>
                        <div className="text-text-secondary">{new Date(programme.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                  {programme.start_date && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                        <Target size={16} />
                      </div>
                      <div>
                        <div className="font-medium">Programme Starts</div>
                        <div className="text-text-secondary">{new Date(programme.start_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                  {programme.max_participants && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="font-medium">Cohort Size</div>
                        <div className="text-text-secondary">{programme.max_participants} spots maximum</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-accent text-white border-none shadow-glass-lg">
                <h3 className="text-lg font-semibold mb-2 text-white">Ready to join?</h3>
                <p className="text-white/80 text-sm mb-6">
                  Applications are currently open. Make sure your profile is complete.
                </p>
                <Link 
                  to={`/programme/${id}/apply`} 
                  className="btn-primary w-full bg-white text-accent hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  Apply Now <ArrowRight size={16} />
                </Link>
                {(programme.start_date || programme.deadline) && (
                  <button 
                    onClick={() => downloadProgrammeCalendar(programme)}
                    className="w-full mt-3 py-2.5 px-4 rounded-full text-sm font-medium text-white/90 border border-white/30 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarPlus size={15} />
                    Add to Calendar
                  </button>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
