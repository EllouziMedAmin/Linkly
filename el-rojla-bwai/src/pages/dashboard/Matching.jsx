import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Check, RefreshCw, Zap, Network, LayoutGrid, Mail, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateMatches } from '../../lib/gemini'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Drawer } from '../../components/ui/Drawer'
import { Modal } from '../../components/ui/Modal'
import { CytoscapeGraph } from '../../components/graph/CytoscapeGraph'

export default function Matching() {
  const { id } = useParams()
  const [view, setView] = useState('card') // 'card' or 'graph'
  const [programme, setProgramme] = useState(null)
  const [participants, setParticipants] = useState([])
  const [mentors, setMentors] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false)
  const [newMentor, setNewMentor] = useState({ name: '', email: '', bio: '', tags: '' })
  const [notification, setNotification] = useState(null)

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      // 1. Fetch Programme
      const { data: prog } = await supabase.from('programmes').select('*').eq('id', id).single()
      setProgramme(prog)

      // 2. Fetch accepted participants
      const { data: parts } = await supabase
        .from('participants')
        .select('*')
        .eq('programme_id', id)
        .eq('status', 'accepted')
      setParticipants(parts || [])

      // 3. Fetch mentors
      const { data: mnts } = await supabase.from('mentors').select('*').eq('programme_id', id)
      
      if (mnts && mnts.length > 0) {
        setMentors(mnts)
      } else {
        // Seed demo mentors into the database to ensure valid UUIDs and foreign keys
        const demoMentors = [
          { programme_id: id, name: 'Dr. Sarah Chen', bio: 'Former VP Eng at Stripe. Expert in fintech scaling.', expertise_tags: ['fintech', 'scaling', 'engineering'] },
          { programme_id: id, name: 'James Wilson', bio: 'Partner at Sequoia. Focuses on B2B SaaS GTM strategies.', expertise_tags: ['b2b', 'saas', 'gtm', 'fundraising'] },
          { programme_id: id, name: 'Elena Rodriguez', bio: 'AI researcher and founder. YC alumni.', expertise_tags: ['ai', 'machine-learning', 'early-stage'] },
          { programme_id: id, name: 'Marcus Dubois', bio: 'Serial entrepreneur. Built and sold two ed-tech platforms.', expertise_tags: ['ed-tech', 'product-market-fit', 'bootstrapping'] },
          { programme_id: id, name: 'Anita Patel', bio: 'Chief Sustainability Officer. Specializes in cleantech and circular economy.', expertise_tags: ['cleantech', 'sustainability', 'hardware'] },
          { programme_id: id, name: 'David Kim', bio: 'Growth hacker and marketer. Helped scale multiple consumer apps to 1M+ users.', expertise_tags: ['growth-marketing', 'b2c', 'user-acquisition'] }
        ]
        const { data: insertedMentors, error: seedError } = await supabase.from('mentors').insert(demoMentors).select('*')
        
        if (seedError) {
          console.error("Failed to seed demo mentors:", seedError)
          setMentors([])
        } else {
          setMentors(insertedMentors || [])
        }
      }

      // 4. Fetch existing matches
      const { data: existingMatches } = await supabase.from('matches').select('*').eq('programme_id', id)
      setMatches(existingMatches || [])
      
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMatches = async (participantId) => {
    setGeneratingFor(participantId)
    const p = participants.find(x => x.id === participantId)
    
    try {
      // 1. Fetch historical data (past applications by this user in other programmes)
      let historicalData = null;
      if (p.user_id) {
        const { data: pastRecords } = await supabase
          .from('participants')
          .select('programme_id, ai_summary, ai_tags, form_answers, status')
          .eq('user_id', p.user_id)
          .neq('programme_id', id)
        
        if (pastRecords && pastRecords.length > 0) {
          historicalData = pastRecords;
          console.log("Found historical ecosystem data for user:", pastRecords);
        }
      }

      // 2. Call Gemini API
      const rawSuggestions = await generateMatches(p, mentors, programme?.match_criteria, historicalData)
      
      // Save suggested matches to Supabase
      if (rawSuggestions && rawSuggestions.length > 0) {
        // Enforce uniqueness and strict Top 3 limit (in case AI ignores the prompt rule)
        const uniqueSuggestions = []
        const seenMentors = new Set()
        for (const s of rawSuggestions) {
          if (!seenMentors.has(s.mentor_id) && mentors.some(m => m.id === s.mentor_id)) {
            seenMentors.add(s.mentor_id)
            uniqueSuggestions.push(s)
          }
        }
        const suggestions = uniqueSuggestions.slice(0, 3)

        const inserts = suggestions.map(s => ({
          programme_id: id,
          participant_id: participantId,
          mentor_id: s.mentor_id,
          match_score: s.score,
          match_reason: s.reason,
          status: 'suggested'
        }))

        // Delete old unconfirmed suggestions first to prevent duplication
        await supabase
          .from('matches')
          .delete()
          .eq('participant_id', participantId)
          .eq('status', 'suggested')

        const { error } = await supabase.from('matches').insert(inserts)
        if (!error) {
          // Update local state (filtering out the old ones just in case)
          const newMatches = [...matches.filter(m => m.participant_id !== participantId || m.status === 'confirmed'), ...inserts]
          setMatches(newMatches)
          showNotification("AI Matches successfully generated!")
        } else {
          console.error("Supabase insert error:", error)
          showNotification("Error: Matches generated but failed to save to database.")
        }
      } else {
        showNotification("Error: The AI could not find any suitable mentors.")
      }
    } catch (err) {
      console.error('Error generating matches:', err)
      showNotification('Error generating matches: ' + err.message)
    } finally {
      setGeneratingFor(null)
    }
  }

  const generateAllMatches = async () => {
    const unmatched = participants.filter(p => !matches.some(m => m.participant_id === p.id))
    for (const p of unmatched) {
      await handleGenerateMatches(p.id)
    }
  }

  const confirmMatch = async (match) => {
    try {
      // 1. Update the chosen match to 'confirmed' in the DB
      const { error: confirmError } = await supabase
        .from('matches')
        .update({ status: 'confirmed' })
        .eq('id', match.id)
        
      if (confirmError) throw confirmError;
      
      // 2. Delete all OTHER 'suggested' matches for this participant from the DB
      await supabase
        .from('matches')
        .delete()
        .eq('participant_id', match.participant_id)
        .eq('status', 'suggested')
        .neq('id', match.id) // keep the one we just confirmed (though it's status is already confirmed now)
      
      // 3. Update local UI state
      const newMatches = matches.filter(m => 
        m.id === match.id || 
        (m.participant_id !== match.participant_id && m.status !== 'rejected')
      ).map(m => m.id === match.id ? { ...m, status: 'confirmed' } : m)
      
      setMatches(newMatches)
      
      // 4. Simulate email dispatch
      showNotification(`Confirmation emails sent to ${match.participant_name || 'Participant'} and ${mentors.find(m => m.id === match.mentor_id)?.name}!`)
    } catch (err) {
      console.error('Failed to confirm match', err)
      showNotification("Failed to confirm match. Please try again.")
    }
  }

  const handleAddMentor = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.from('mentors').insert({
        programme_id: id,
        name: newMentor.name,
        email: newMentor.email,
        bio: newMentor.bio,
        expertise_tags: newMentor.tags.split(',').map(t => t.trim()).filter(Boolean)
      }).select().single()

      if (error) throw error

      setMentors([...mentors, data])
      setIsMentorModalOpen(false)
      setNewMentor({ name: '', email: '', bio: '', tags: '' })
      showNotification('Mentor successfully added!')
    } catch (err) {
      console.error('Failed to add mentor:', err)
      showNotification('Failed to add mentor. Ensure the user email exists.')
    }
  }

  // Generate Cytoscape elements
  const graphElements = useMemo(() => {
    const elements = []
    
    // Add Participants (Purple Nodes)
    participants.forEach(p => {
      const isMatched = matches.some(m => m.participant_id === p.id && m.status === 'confirmed')
      elements.push({
        data: {
          id: p.id,
          label: p.name,
          color: isMatched ? '#7F77DD' : '#F5F5F7',
          borderColor: isMatched ? 'transparent' : '#FF453A',
          borderWidth: isMatched ? 0 : 2,
          type: 'participant',
          ...p
        }
      })
    })

    // Add Mentors (Teal Nodes)
    mentors.forEach(m => {
      elements.push({
        data: {
          id: m.id,
          label: m.name,
          color: '#30D1BC',
          borderColor: 'transparent',
          borderWidth: 0,
          type: 'mentor',
          ...m
        }
      })
    })

    // Add Edges (Confirmed matches only)
    matches.filter(m => m.status === 'confirmed').forEach(m => {
      elements.push({
        data: {
          id: `${m.participant_id}-${m.mentor_id}`,
          source: m.participant_id,
          target: m.mentor_id,
          width: Math.max(1, (m.match_score / 100) * 4), // Thicker edge = higher score
          score: m.match_score
        }
      })
    })

    return elements
  }, [participants, mentors, matches])

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-up">
          <div className="bg-accent text-white px-6 py-4 rounded-2xl shadow-glass-lg flex items-center gap-3 border border-white/20">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Mail size={16} />
            </div>
            <p className="font-medium pr-4">{notification}</p>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Sub-nav */}
      <div className="bg-white/60 border-b border-glass-border sticky top-16 z-40 backdrop-blur-md shrink-0">
        <div className="container-full py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-text-secondary hover:text-text-primary">
              <ChevronLeft size={20} />
            </Link>
            <h2 className="font-semibold text-lg">{programme?.title || 'Programme'}</h2>
            <Badge variant="purple">AI Matching Engine</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={generateAllMatches}
              className="btn-ghost text-accent hover:bg-accent-subtle"
            >
              <Zap size={16} /> Auto-Match All
            </button>
            <button 
              onClick={() => setIsMentorModalOpen(true)}
              className="btn-secondary py-1.5 text-xs h-8"
            >
              Add Mentor
            </button>

            <div className="flex bg-black/5 p-1 rounded-lg">
              <button
                onClick={() => setView('card')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  view === 'card' ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <LayoutGrid size={14} /> Card View
              </button>
              <button
                onClick={() => setView('graph')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                  view === 'graph' ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Network size={14} /> Graph View
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pb-20">
        <div className="container-full flex flex-col gap-8">
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          ) : view === 'graph' ? (
            /* Graph View - The WOW factor */
            <div className="h-[calc(100vh-180px)] relative">
              <CytoscapeGraph 
                elements={graphElements} 
                onNodeClick={setSelectedNode} 
              />
              
              {/* Legend overlay — compact */}
              <div className="absolute bottom-3 left-3 px-3 py-2 rounded-xl flex items-center gap-3 flex-wrap"
                style={{ 
                  background: 'rgba(20, 18, 37, 0.7)', 
                  backdropFilter: 'blur(8px)', 
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '9px',
                  maxWidth: '320px'
                }}>
                <span className="flex items-center gap-1.5 text-white/50"><span className="w-2 h-2 rounded-full bg-[#7F77DD]" /> Matched</span>
                <span className="flex items-center gap-1.5 text-white/50"><span className="w-2 h-2 rounded-full bg-[#3a3456] border border-[#FF453A]" /> Unmatched</span>
                <span className="flex items-center gap-1.5 text-white/50"><span className="w-2 h-2 rounded-full bg-[#30D1BC]" /> Mentor</span>
                <span className="flex items-center gap-1.5 text-white/50"><span className="w-4 h-[1.5px] bg-[#7F77DD] rounded-full" /> Confirmed Link</span>
                <span className="flex items-center gap-1.5 text-white/50"><span className="w-4 h-[1.5px] rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FFB340 0, #FFB340 3px, transparent 3px, transparent 6px)' }} /> Suggested Link</span>
              </div>
            </div>
          ) : (
            /* Card View - Action oriented */
            <div className="flex flex-col gap-8 pb-20">
              {/* Available Mentors Pool */}
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-1">Mentor Pool ({mentors.length})</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
                  {mentors.map(m => (
                    <Card key={m.id} className="min-w-[280px] max-w-[280px] p-4 snap-start border border-glass-border bg-white/40 hover:border-accent/30 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#30D1BC]/20 text-[#30D1BC] flex items-center justify-center font-bold text-xs shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <h4 className="font-bold text-sm truncate">{m.name}</h4>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2" title={m.bio}>{m.bio}</p>
                      <div className="flex gap-1 flex-wrap mt-3">
                        {m.expertise_tags?.slice(0, 3).map(t => <Badge key={t} variant="teal" className="text-[10px] py-0">{t}</Badge>)}
                        {m.expertise_tags?.length > 3 && <span className="text-[10px] text-text-tertiary">+{m.expertise_tags.length - 3}</span>}
                      </div>
                    </Card>
                  ))}
                  {mentors.length === 0 && (
                    <div className="text-sm text-text-secondary italic px-1">No mentors available. Add a mentor to start matching.</div>
                  )}
                </div>
              </div>

              {/* Participants Grid */}
              <div>
                <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-1">Participants needing matches ({participants.length})</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

              {participants.map(p => {
                const pMatches = matches.filter(m => m.participant_id === p.id)
                const confirmed = pMatches.find(m => m.status === 'confirmed')
                const suggested = pMatches.filter(m => m.status === 'suggested').sort((a,b) => b.match_score - a.match_score)

                return (
                  <Card key={p.id} className="flex flex-col h-full border-2 transition-colors hover:border-accent/30">
                    <div className="p-5 border-b border-glass-border bg-white/40">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{p.name}</h3>
                        {confirmed ? (
                          <Badge variant="green">Matched</Badge>
                        ) : (
                          <Badge variant="red">Needs Match</Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2" title={p.ai_summary}>
                        {p.ai_summary}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-3">
                        {p.ai_tags?.map(t => <Badge key={t} variant="gray" className="text-[10px]">{t}</Badge>)}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-4 bg-white/10">
                      {confirmed ? (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Confirmed Mentor</h4>
                          <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                            <div className="font-bold text-green-700">{mentors.find(m => m.id === confirmed.mentor_id)?.name}</div>
                            <div className="text-sm text-green-600 mt-1">{confirmed.match_reason}</div>
                          </div>
                        </div>
                      ) : pMatches.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <p className="text-sm text-text-secondary mb-4">No matches generated yet.</p>
                          <button 
                            onClick={() => handleGenerateMatches(p.id)}
                            disabled={generatingFor === p.id}
                            className="btn-primary w-full text-sm"
                          >
                            {generatingFor === p.id ? 'Analyzing...' : 'Generate AI Matches'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center justify-between">
                            Top Match Suggestions
                            <button onClick={() => handleGenerateMatches(p.id)} className="text-accent hover:underline lowercase">regenerate</button>
                          </h4>
                          
                          {suggested.map((m, i) => {
                            const mentor = mentors.find(mnt => mnt.id === m.mentor_id)
                            return (
                              <div key={m.id || i} className="p-4 rounded-xl border border-glass-border bg-white flex flex-col gap-2 relative group">
                                {i === 0 && <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">1</div>}
                                
                                <div className="flex justify-between items-center">
                                  <div className="font-bold text-sm">{mentor?.name}</div>
                                  <div className="text-accent font-bold text-sm bg-accent-subtle px-2 py-0.5 rounded-full">{m.match_score}%</div>
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed">{m.match_reason}</p>
                                
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex gap-2">
                                  <button onClick={() => confirmMatch(m)} className="btn-primary flex-1 py-1 text-xs">Confirm</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer for Graph Node Clicks */}
      <Drawer isOpen={!!selectedNode} onClose={() => setSelectedNode(null)} title={selectedNode?.type === 'participant' ? 'Participant Profile' : 'Mentor Profile'}>
        {selectedNode && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">{selectedNode.name}</h2>
            {selectedNode.type === 'participant' ? (
              <>
                <p className="text-text-secondary">{selectedNode.ai_summary}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.ai_tags?.map(t => <Badge key={t} variant="purple">{t}</Badge>)}
                </div>
              </>
            ) : (
              <>
                <p className="text-text-secondary">{selectedNode.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.expertise_tags?.map(t => <Badge key={t} variant="teal">{t}</Badge>)}
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Modal isOpen={isMentorModalOpen} onClose={() => setIsMentorModalOpen(false)} title="Add a Mentor Manually">
        <form onSubmit={handleAddMentor} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Name</label>
            <input required type="text" value={newMentor.name} onChange={e => setNewMentor({...newMentor, name: e.target.value})} className="input-glass" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email (must match a registered user for portals to work)</label>
            <input type="email" value={newMentor.email} onChange={e => setNewMentor({...newMentor, email: e.target.value})} className="input-glass" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Bio / Experience</label>
            <textarea required value={newMentor.bio} onChange={e => setNewMentor({...newMentor, bio: e.target.value})} className="input-glass" rows={3} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Expertise Tags (comma separated)</label>
            <input required type="text" value={newMentor.tags} onChange={e => setNewMentor({...newMentor, tags: e.target.value})} className="input-glass" placeholder="fintech, marketing, ai" />
          </div>
          <button type="submit" className="btn-primary w-full mt-4">Add Mentor</button>
        </form>
      </Modal>
    </PageWrapper>
  )
}
