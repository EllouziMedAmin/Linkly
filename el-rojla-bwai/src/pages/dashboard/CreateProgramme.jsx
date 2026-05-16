import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'

export default function CreateProgramme() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    category: 'hackathon',
    start_date: '',
    end_date: '',
    deadline: '',
    max_participants: '',
    cover_image_url: ''
  })

  // Step 2: Selection Type
  const [selectionType, setSelectionType] = useState('ai_selected') // or fcfs

  // Step 3: Form Builder
  const [formFields, setFormFields] = useState([
    // Start with some default fields
    { id: 1, field_type: 'text', label: 'Company / Project Name', required: true, options: [], eligibility_rule: '' },
    { id: 2, field_type: 'textarea', label: 'Describe what you are building', required: true, options: [], eligibility_rule: '' }
  ])

  // Step 4: Matching Setup
  const [matchingSetup, setMatchingSetup] = useState({
    needs_matching: true,
    match_criteria: {
      industry: true,
      stage: true,
      skills: true,
      location: false
    }
  })

  const handleNext = () => setStep(prev => prev + 1)
  const handleBack = () => setStep(prev => prev - 1)

  const addField = () => {
    setFormFields([...formFields, {
      id: Date.now(),
      field_type: 'text',
      label: 'New Question',
      required: false,
      options: [],
      eligibility_rule: ''
    }])
  }

  const removeField = (id) => {
    setFormFields(formFields.filter(f => f.id !== id))
  }

  const updateField = (id, key, value) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f))
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // 1. Create Programme
      const { data: prog, error: progErr } = await supabase
        .from('programmes')
        .insert({
          title: basicInfo.title,
          description: basicInfo.description,
          category: basicInfo.category,
          organizer_id: user.id,
          selection_type: selectionType,
          max_participants: parseInt(basicInfo.max_participants) || null,
          deadline: basicInfo.deadline || null,
          start_date: basicInfo.start_date || null,
          end_date: basicInfo.end_date || null,
          cover_image_url: basicInfo.cover_image_url || null,
          needs_matching: matchingSetup.needs_matching,
          match_criteria: matchingSetup.match_criteria,
          status: 'open' // Auto-publish for demo
        })
        .select()
        .single()

      if (progErr) throw progErr

      // 2. Save Form Fields
      if (formFields.length > 0) {
        const fieldsToInsert = formFields.map((f, i) => ({
          programme_id: prog.id,
          field_type: f.field_type,
          label: f.label,
          required: f.required,
          options: f.options,
          eligibility_rule: f.eligibility_rule,
          field_order: i
        }))

        const { error: fieldErr } = await supabase
          .from('form_fields')
          .insert(fieldsToInsert)

        if (fieldErr) throw fieldErr
      }

      navigate('/dashboard')

    } catch (err) {
      console.error('Error creating programme:', err)
      setError(err.message || 'Failed to create programme')
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <Navbar />
      <div className="container-narrow py-12">
        <div className="mb-8">
          <Link to="/dashboard" className="text-text-secondary hover:text-text-primary text-sm font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Create Programme</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {[1, 2, 3, 4, 5].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step === s ? 'bg-accent text-white shadow-[0_0_0_4px_rgba(127,119,221,0.2)]' :
                  step > s ? 'bg-accent text-white' : 'bg-white text-text-tertiary border border-glass-border'
                }`}>
                  {step > s ? <Check size={18} /> : s}
                </div>
                <span className={`text-xs font-medium absolute top-12 whitespace-nowrap ${
                  step === s ? 'text-accent' : step > s ? 'text-text-primary' : 'text-text-tertiary'
                }`}>
                  {['Basic Info', 'Selection', 'Form Builder', 'Matching', 'Publish'][s-1]}
                </span>
              </div>
              {s < 5 && (
                <div className={`flex-1 h-1 rounded-full mx-2 transition-colors ${
                  step > s ? 'bg-accent' : 'bg-glass-border'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="p-8 mt-16">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="animate-fade-in flex flex-col gap-6">
              <h2 className="text-xl font-bold border-b border-glass-border pb-4">Basic Information</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Programme Title *</label>
                <input 
                  type="text" 
                  value={basicInfo.title}
                  onChange={e => setBasicInfo({...basicInfo, title: e.target.value})}
                  className="input-glass"
                  placeholder="e.g. Build with AI 2026 Hackathon"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  value={basicInfo.description}
                  onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
                  className="input-glass"
                  placeholder="Describe the goals and what participants get..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    value={basicInfo.category}
                    onChange={e => setBasicInfo({...basicInfo, category: e.target.value})}
                    className="input-glass"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="accelerator">Accelerator</option>
                    <option value="competition">Competition</option>
                    <option value="grant">Grant</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Max Participants</label>
                  <input 
                    type="number" 
                    value={basicInfo.max_participants}
                    onChange={e => setBasicInfo({...basicInfo, max_participants: e.target.value})}
                    className="input-glass"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Application Deadline</label>
                  <input 
                    type="date" 
                    value={basicInfo.deadline}
                    onChange={e => setBasicInfo({...basicInfo, deadline: e.target.value})}
                    className="input-glass"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Programme Start Date</label>
                  <input 
                    type="date" 
                    value={basicInfo.start_date}
                    onChange={e => setBasicInfo({...basicInfo, start_date: e.target.value})}
                    className="input-glass"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Selection Type */}
          {step === 2 && (
            <div className="animate-fade-in flex flex-col gap-6">
              <h2 className="text-xl font-bold border-b border-glass-border pb-4">Selection Type</h2>
              <p className="text-text-secondary text-sm">How should participants be selected for this programme?</p>
              
              <div className="grid gap-4">
                <div 
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-colors ${selectionType === 'ai_selected' ? 'border-accent bg-accent-subtle' : 'border-glass-border hover:border-text-tertiary'}`}
                  onClick={() => setSelectionType('ai_selected')}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-accent">AI Selected (Ranked Pool)</h3>
                    {selectionType === 'ai_selected' && <Check className="text-accent" />}
                  </div>
                  <p className="text-text-secondary text-sm">
                    Applicants are scored and ranked by Gemini AI against your criteria. You review the ranked pool and approve the best fits. Recommended for accelerators and grants.
                  </p>
                </div>

                <div 
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-colors ${selectionType === 'fcfs' ? 'border-teal-500 bg-teal-50' : 'border-glass-border hover:border-text-tertiary'}`}
                  onClick={() => setSelectionType('fcfs')}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-teal-600">First Come First Served</h3>
                    {selectionType === 'fcfs' && <Check className="text-teal-500" />}
                  </div>
                  <p className="text-text-secondary text-sm">
                    Applicants are automatically accepted immediately upon registration until the max participant cap is reached. Best for open hackathons.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Form Builder */}
          {step === 3 && (
            <div className="animate-fade-in flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-glass-border pb-4">
                <h2 className="text-xl font-bold">Registration Form Builder</h2>
                <button onClick={addField} className="btn-ghost text-accent flex items-center gap-1">
                  <Plus size={16} /> Add Field
                </button>
              </div>
              <p className="text-text-secondary text-sm">
                Name, Email, and Profile Type (Startup/Team/Individual) are always included automatically. Add custom questions below.
              </p>

              <div className="flex flex-col gap-4">
                {formFields.map((field, index) => (
                  <div key={field.id} className="p-5 border border-glass-border rounded-xl bg-white/50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-sm">Question {index + 1}</h4>
                      <button onClick={() => removeField(field.id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-text-secondary">Field Label</label>
                        <input 
                          type="text" 
                          value={field.label}
                          onChange={e => updateField(field.id, 'label', e.target.value)}
                          className="input-glass py-2"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-text-secondary">Field Type</label>
                        <select 
                          value={field.field_type}
                          onChange={e => updateField(field.id, 'field_type', e.target.value)}
                          className="input-glass py-2"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text</option>
                          <option value="url">URL Link</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown</option>
                        </select>
                      </div>
                    </div>

                    {field.field_type === 'select' && (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-text-secondary">Dropdown Options (comma separated)</label>
                        <input 
                          type="text" 
                          value={field.options?.join(', ') || ''}
                          onChange={e => updateField(field.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                          className="input-glass py-2"
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 w-full flex flex-col gap-2">
                        <label className="text-xs font-medium text-text-secondary">Eligibility Rule (Optional for AI scoring)</label>
                        <input 
                          type="text" 
                          value={field.eligibility_rule}
                          onChange={e => updateField(field.id, 'eligibility_rule', e.target.value)}
                          className="input-glass py-2 text-sm"
                          placeholder="e.g. Must have > 2 years experience"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium mt-4 md:mt-0">
                        <input 
                          type="checkbox" 
                          checked={field.required}
                          onChange={e => updateField(field.id, 'required', e.target.checked)}
                          className="w-4 h-4 rounded text-accent"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                ))}
                {formFields.length === 0 && (
                  <div className="text-center py-8 text-text-tertiary text-sm border border-dashed rounded-xl border-glass-border">
                    No custom fields added. Standard fields (Name, Email) will be used.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Matching Setup */}
          {step === 4 && (
            <div className="animate-fade-in flex flex-col gap-6">
              <h2 className="text-xl font-bold border-b border-glass-border pb-4">Mentor Matching</h2>
              <p className="text-text-secondary text-sm">Configure how AI should match participants with mentors/judges.</p>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-glass-border cursor-pointer hover:bg-white/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={matchingSetup.needs_matching}
                  onChange={e => setMatchingSetup({...matchingSetup, needs_matching: e.target.checked})}
                  className="w-5 h-5 rounded text-accent"
                />
                <div className="font-medium">Enable AI Mentor Matching</div>
              </label>

              {matchingSetup.needs_matching && (
                <div className="pl-8 flex flex-col gap-4 animate-slide-up">
                  <h4 className="font-semibold text-sm">Match based on:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(matchingSetup.match_criteria).map(key => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox"
                          checked={matchingSetup.match_criteria[key]}
                          onChange={e => setMatchingSetup({
                            ...matchingSetup, 
                            match_criteria: { ...matchingSetup.match_criteria, [key]: e.target.checked }
                          })}
                          className="w-4 h-4 rounded text-accent"
                        />
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Publish */}
          {step === 5 && (
            <div className="animate-fade-in flex flex-col items-center text-center gap-6 py-8">
              <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center">
                <Check size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready to Publish</h2>
                <p className="text-text-secondary max-w-md mx-auto">
                  Your programme "{basicInfo.title || 'Untitled'}" is fully configured with {formFields.length} custom questions and AI-driven {selectionType === 'ai_selected' ? 'selection' : 'registration'}.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-glass-border">
            {step > 1 ? (
              <button onClick={handleBack} className="btn-secondary" disabled={loading}>
                <ChevronLeft size={18} /> Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 5 ? (
              <button 
                onClick={handleNext} 
                className="btn-primary"
                disabled={step === 1 && !basicInfo.title}
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
                {loading ? 'Publishing...' : 'Publish Programme'} <Check size={18} />
              </button>
            )}
          </div>
        </Card>
      </div>
    </PageWrapper>
  )
}
