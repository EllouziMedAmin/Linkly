import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { enrichProfile } from '../lib/gemini'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { AlertCircle, CheckCircle2, ArrowRight, CalendarPlus, Clock, MapPin } from 'lucide-react'
import { downloadProgrammeCalendar, downloadDeadlineReminder } from '../lib/calendar'

export default function Apply() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [programme, setProgramme] = useState(null)
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [hasApplied, setHasApplied] = useState(false)

  // Standard fields
  const [name, setName] = useState(user?.user_metadata?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileType, setProfileType] = useState('startup')
  
  // Custom form answers
  const [answers, setAnswers] = useState({})
  const [files, setFiles] = useState({}) // Stores base64 of files

  useEffect(() => {
    fetchForm()
  }, [id, user])

  const fetchForm = async () => {
    try {
      // 1. Get programme details
      const { data: prog, error: progErr } = await supabase
        .from('programmes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (progErr) throw progErr
      setProgramme(prog)

      // 2. Get custom fields for this programme
      const { data: formFields, error: fieldErr } = await supabase
        .from('form_fields')
        .select('*')
        .eq('programme_id', id)
        .order('field_order', { ascending: true })

      if (fieldErr) throw fieldErr
      setFields(formFields || [])

      // 3. Check if user already applied
      if (user) {
        const { data: existingApp, error: existingErr } = await supabase
          .from('participants')
          .select('id')
          .eq('programme_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
          
        if (existingErr) throw existingErr
        if (existingApp) setHasApplied(true)
      }

    } catch (err) {
      console.error('Error fetching form:', err)
      setError('Could not load registration form')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (fieldId, value) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleFileChange = async (fieldId, file) => {
    if (!file) return
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          // dataURL format: "data:application/pdf;base64,JVBERi..."
          // Extract just the base64 part for Gemini
          const result = reader.result
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = error => reject(error)
      })

      setFiles(prev => ({
        ...prev,
        [fieldId]: {
          base64,
          mimeType: file.type,
          name: file.name
        }
      }))
      
      // Also save the filename in the text answers so organizers can see what was uploaded
      setAnswers(prev => ({
        ...prev,
        [fieldId]: `[File Uploaded: ${file.name}]`
      }))
      
    } catch (err) {
      console.error('Error reading file:', err)
      setError('Failed to process file upload')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      // Prompt to login, saving state (simplified for demo: redirect to login)
      navigate(`/auth/login?redirect=/programme/${id}/apply`)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Call Gemini to enrich the profile based on answers
      const allAnswers = {
        name,
        email,
        profileType,
        ...answers
      }
      
      const fileArray = Object.values(files)
      const aiEnrichment = await enrichProfile(allAnswers, programme.description, fileArray, fields)
      
      // Determine initial status based on programme selection type
      let initialStatus = 'pending'
      if (programme.selection_type === 'fcfs') {
        // Here we'd ideally check spots_left via a transaction, but assuming yes for now
        initialStatus = 'accepted'
      }

      // 2. Save participant to Supabase
      const { error: insertErr } = await supabase
        .from('participants')
        .insert({
          programme_id: id,
          user_id: user.id,
          name,
          email,
          profile_type: profileType,
          form_answers: answers,
          ai_summary: `${aiEnrichment.summary}\n\nScore Reasoning: ${aiEnrichment.reason || 'N/A'}`,
          ai_tags: aiEnrichment.tags,
          ai_score: aiEnrichment.score,
          status: initialStatus
        })

      if (insertErr) {
        if (insertErr.code === '23505') {
          throw new Error('You have already applied to this programme.')
        }
        throw insertErr
      }

      // Success!
      setSuccess(true)

    } catch (err) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit application')
    } finally {
      setSubmitting(false)
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

  if (success) {
    return (
      <PageWrapper>
        <Navbar />
        <div className="container-narrow py-12">
          <Card className="p-10 text-center max-w-lg mx-auto animate-scale-in">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
            <p className="text-text-secondary mb-6">
              {programme.selection_type === 'fcfs' 
                ? "You've been successfully registered for this programme."
                : "Your application is under review. You'll be notified once a decision is made."}
            </p>

            {/* Programme Summary */}
            <div className="bg-bg-light rounded-xl p-5 text-left mb-6 flex flex-col gap-3">
              <h3 className="font-semibold text-sm text-text-primary">{programme.title}</h3>
              {programme.start_date && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={14} className="shrink-0 text-accent" />
                  <span>Starts: {new Date(programme.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {programme.deadline && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={14} className="shrink-0 text-red-400" />
                  <span>Deadline: {new Date(programme.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
              {programme.location && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={14} className="shrink-0 text-accent" />
                  <span>{programme.location}</span>
                </div>
              )}
            </div>

            {/* Calendar Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              {(programme.start_date || programme.deadline) && (
                <button 
                  onClick={() => downloadProgrammeCalendar(programme)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3 bg-accent-subtle border-accent/20 text-accent hover:bg-accent/10"
                >
                  <CalendarPlus size={18} />
                  Add Programme to Calendar
                </button>
              )}
              {programme.deadline && (
                <button 
                  onClick={() => downloadDeadlineReminder(programme)}
                  className="btn-ghost w-full text-sm text-text-secondary hover:text-accent"
                >
                  <Clock size={14} />
                  Set Deadline Reminder (48h before)
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/portal/participant" className="btn-primary">
                Go to Portal
              </Link>
              <Link to="/discover" className="btn-secondary">
                Browse More
              </Link>
            </div>
          </Card>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Navbar />
      <div className="container-narrow py-12">
        <Link to={`/programme/${id}`} className="text-text-secondary hover:text-text-primary flex items-center gap-2 font-medium mb-6">
          ← Back to programme
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Apply for {programme?.title}</h1>
          <p className="text-text-secondary">Please fill out all required fields below.</p>
        </div>

        {hasApplied ? (
          <Card className="p-10 text-center max-w-lg mx-auto mt-8 animate-scale-in border-green-100">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">Already Applied</h2>
            <p className="text-text-secondary mb-6">
              You have already submitted an application for this programme. You can track your status from your Participant Portal.
            </p>
            <div className="flex justify-center">
              <Link to="/portal/participant" className="btn-primary">
                Go to Participant Portal
              </Link>
            </div>
          </Card>
        ) : user && programme && user.id === programme.organizer_id ? (
          <Card className="p-10 text-center max-w-lg mx-auto mt-8 animate-scale-in border-red-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">Action Not Allowed</h2>
            <p className="text-text-secondary mb-6">
              You are the organizer of this programme and cannot apply to it. To test the true applicant experience, please copy the application link and open it in an <strong>Incognito Window</strong>.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/programme/${id}/apply`)
                  alert('Link copied to clipboard!')
                }}
                className="btn-secondary"
              >
                Copy Application Link
              </button>
              <Link to={`/dashboard/programme/${id}/applicants`} className="btn-primary">
                Back to Dashboard
              </Link>
            </div>
          </Card>
        ) : programme?.deadline && new Date() > new Date(new Date(programme.deadline).setHours(23, 59, 59, 999)) ? (
          <Card className="p-10 text-center max-w-lg mx-auto mt-8 animate-scale-in border-amber-100">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-text-primary">Registration Closed</h2>
            <p className="text-text-secondary mb-6">
              The application deadline for this programme was <strong>{new Date(programme.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>. Applications are no longer being accepted.
            </p>
            <div className="flex justify-center">
              <Link to="/discover" className="btn-primary">
                Browse Other Programmes
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {!user && (
              <div className="mb-8 p-4 bg-accent-subtle rounded-xl flex items-start gap-3 border border-accent/20">
                <AlertCircle size={20} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-accent">You are not logged in</p>
                  <p className="text-sm text-accent/80 mt-1">
                    You'll need an account to track your application. We'll ask you to log in or sign up when you submit.
                  </p>
                </div>
              </div>
            )}

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3 border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Standard Profile Fields */}
            <div className="flex flex-col gap-5 pb-8 border-b border-glass-border">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-secondary px-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-glass"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-text-secondary px-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-glass"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-secondary px-1">Applying As *</label>
                <select
                  required
                  value={profileType}
                  onChange={e => setProfileType(e.target.value)}
                  className="input-glass"
                >
                  <option value="startup">Startup / Company</option>
                  <option value="team">Team / Project</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
            </div>

            {/* Custom Organizer Fields */}
            {fields.length > 0 && (
              <div className="flex flex-col gap-5">
                <h3 className="font-semibold text-lg">Programme Questions</h3>
                
                {fields.map(field => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-secondary px-1">
                      {field.label} {field.required && '*'}
                    </label>
                    
                    {field.field_type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={answers[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className="input-glass"
                        rows={4}
                      />
                    ) : field.field_type === 'select' ? (
                      <select
                        required={field.required}
                        value={answers[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className="input-glass"
                      >
                        <option value="">Select an option...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.field_type === 'file' ? (
                      <input
                        type="file"
                        accept=".pdf"
                        required={field.required}
                        onChange={e => handleFileChange(field.id, e.target.files[0])}
                        className="input-glass file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-subtle file:text-accent hover:file:bg-accent/20 cursor-pointer"
                      />
                    ) : (
                      <input
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'url' ? 'url' : 'text'}
                        required={field.required}
                        value={answers[field.id] || ''}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className="input-glass"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-glass-border">
              <button 
                type="submit" 
                className="btn-primary w-full sm:w-auto"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Submit Application'}
                {!submitting && <ArrowRight size={16} />}
              </button>
              <p className="text-xs text-text-tertiary mt-3 text-center sm:text-left">
                By submitting, your application will be analyzed by our AI for optimal matching and scoring.
              </p>
            </div>
          </form>
        </Card>
        </>
        )}
      </div>
    </PageWrapper>
  )
}
