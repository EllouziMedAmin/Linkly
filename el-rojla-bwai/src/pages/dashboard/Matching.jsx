import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Check, RefreshCw, Zap, Network, LayoutGrid } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { generateMatches } from '../../lib/gemini'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Navbar } from '../../components/layout/Navbar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Drawer } from '../../components/ui/Drawer'
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
      // Fake mentors for demo if none exist
      const loadedMentors = mnts?.length > 0 ? mnts : generateDemoMentors(id)
      setMentors(loadedMentors)

      // 4. Fetch existing matches
      const { data: existingMatches } = await supabase.from('matches').select('*').eq('programme_id', id)
      setMatches(existingMatches || [])
      
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateDemoMentors = (progId) => {
    return [
      { id: 'm1', programme_id: progId, name: 'Dr. Sarah Chen', bio: 'Former VP Eng at Stripe. Expert in fintech scaling.', expertise_tags: ['fintech', 'scaling', 'engineering'] },
      { id: 'm2', programme_id: progId, name: 'James Wilson', bio: 'Partner at Sequoia. Focuses on B2B SaaS GTM strategies.', expertise_tags: ['b2b', 'saas', 'gtm', 'fundraising'] },
      { id: 'm3', programme_id: progId, name: 'Elena Rodriguez', bio: 'AI researcher and founder. YC alumni.', expertise_tags: ['ai', 'machine-learning', 'early-stage'] }
    ]
  }

  const handleGenerateMatches = async (participantId) => {
    setGeneratingFor(participantId)
    const p = participants.find(x => x.id === participantId)
    
    try {
      // Call Gemini API
      const suggestions = await generateMatches(p, mentors, programme?.match_criteria)
      
      // Save suggested matches to Supabase
      if (suggestions && suggestions.length > 0) {
        const inserts = suggestions.map(s => ({
          programme_id: id,
          participant_id: participantId,
          mentor_id: s.mentor_id,
          match_score: s.score,
          match_reason: s.reason,
          status: 'suggested'
        }))

        // We ideally delete old suggestions first, but for demo just insert/update
        const { error } = await supabase.from('matches').insert(inserts)
        if (!error) {
          // Update local state
          const newMatches = [...matches.filter(m => m.participant_id !== participantId), ...inserts]
          setMatches(newMatches)
        }
      }
    } catch (err) {
      console.error('Error generating matches:', err)
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
      // 1. Update the confirmed match
      await supabase.from('matches').update({ status: 'confirmed' }).eq('id', match.id)
      
      // 2. Reject other suggestions for this participant
      // In a real app we'd have IDs for all suggestions, here we simulate it in local state
      
      const newMatches = matches.map(m => {
        if (m.participant_id === match.participant_id) {
          return m.mentor_id === match.mentor_id 
            ? { ...m, status: 'confirmed' } 
            : { ...m, status: 'rejected' }
        }
        return m
      }).filter(m => m.status === 'confirmed' || m.status === 'suggested')
      
      setMatches(newMatches)
    } catch (err) {
      console.error('Failed to confirm match', err)
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
    <PageWrapper className="h-screen overflow-hidden flex flex-col">
      <Navbar />
      
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="container-full h-full flex flex-col">
          
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
              
              {/* Legend overlay */}
              <div className="absolute top-4 left-4 p-4 glass-card-static text-xs flex flex-col gap-2">
                <div className="font-semibold mb-1">Network Legend</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#7F77DD]" /> Participant (Matched)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#F5F5F7] border border-[#FF453A]" /> Participant (Needs Match)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#30D1BC]" /> Mentor / Judge</div>
                <div className="flex items-center gap-2"><span className="w-6 h-[2px] bg-[#AEAEB2]" /> Confirmed Match</div>
              </div>
            </div>
          ) : (
            /* Card View - Action oriented */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
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
    </PageWrapper>
  )
}
