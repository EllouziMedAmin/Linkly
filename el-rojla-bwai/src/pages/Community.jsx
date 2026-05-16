import React, { useEffect, useState, useMemo } from 'react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Navbar } from '../components/layout/Navbar'
import { supabase } from '../lib/supabase'
import { CytoscapeGraph } from '../components/graph/CytoscapeGraph'
import { Network, Search, Users, Zap } from 'lucide-react'

export default function Community() {
  const [loading, setLoading] = useState(true)
  const [elements, setElements] = useState([])
  const [stats, setStats] = useState({ users: 0, mentors: 0, links: 0 })

  useEffect(() => {
    fetchGlobalEcosystem()
  }, [])

  const fetchGlobalEcosystem = async () => {
    try {
      /**
       * SCALABILITY ARCHITECTURE WARNING:
       * For this Hackathon/MVP, we are fetching all participants, mentors, and matches 
       * to the client to render the global ecosystem graph. 
       * 
       * IN PRODUCTION: 
       * This client-side fetch will not scale as the user base grows. 
       * We MUST implement a backend endpoint (e.g., Supabase Edge Function or external API) 
       * that pre-aggregates and paginates this graph data (using techniques like GraphQL, Redis caching, 
       * or Neo4j graph databases) and serves simplified JSON topology to the client.
       * 
       * This ensures O(1) or O(log n) loading times regardless of database size.
       */
      
      const { data: participants } = await supabase.from('participants').select('*')
      const { data: mentors } = await supabase.from('mentors').select('*')
      const { data: matches } = await supabase.from('matches').select('*').in('status', ['confirmed', 'suggested'])

      if (!participants || !mentors) return

      // Deduplicate participants by user_id to form a single "Ecosystem User" node 
      // even if they are in multiple programmes.
      const uniqueUsers = new Map()
      participants.forEach(p => {
        if (!p.user_id) return
        if (!uniqueUsers.has(p.user_id)) {
          uniqueUsers.set(p.user_id, {
            ...p,
            id: p.user_id, // Normalize ID to user_id for graph linking
            programmes_count: 1
          })
        } else {
          const existing = uniqueUsers.get(p.user_id)
          existing.programmes_count += 1
          // Aggregate tags if needed here
        }
      })

      const graphElements = []

      // 1. Add Unique Users (Purple Nodes)
      Array.from(uniqueUsers.values()).forEach(user => {
        graphElements.push({
          data: {
            id: user.id,
            label: user.name,
            color: '#7F77DD',
            borderColor: 'transparent',
            borderWidth: 0,
            type: 'participant',
            ...user
          }
        })
      })

      // 2. Add Mentors (Teal Nodes)
      mentors.forEach(m => {
        graphElements.push({
          data: {
            id: m.id, // Mentor IDs are unique per programme currently, but sufficient for visual
            label: m.name,
            color: '#30D1BC',
            borderColor: 'transparent',
            borderWidth: 0,
            type: 'mentor',
            ...m
          }
        })
      })

      // 3. Add Confirmed Match Edges (Linkages)
      matches?.forEach(match => {
        const p = participants.find(part => part.id === match.participant_id)
        if (!p || !p.user_id) return // Must exist and have user_id
        
        graphElements.push({
          data: {
            id: `edge-${match.id}`,
            source: match.mentor_id,
            target: p.user_id, // Link to the normalized User ID
            score: match.match_score || 50,
            status: match.status
          }
        })
      })

      setElements(graphElements)
      setStats({
        users: uniqueUsers.size,
        mentors: mentors.length,
        links: matches?.length || 0
      })

    } catch (error) {
      console.error("Failed to load ecosystem data", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <Navbar />
      <div className="container-full mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Network className="text-accent" />
              Lyncly Community Ecosystem
            </h1>
            <p className="text-text-secondary mt-2 max-w-2xl">
              A bird's-eye view of all cross-programme linkages, mentors, and innovators operating within our global network. 
            </p>
          </div>

          <div className="flex gap-4">
            <div className="glass-panel px-4 py-3 rounded-xl flex flex-col">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Total Nodes</span>
              <span className="text-xl font-bold">{stats.users + stats.mentors}</span>
            </div>
            <div className="glass-panel px-4 py-3 rounded-xl flex flex-col">
              <span className="text-xs text-text-tertiary uppercase tracking-wider font-semibold">Active Linkages</span>
              <span className="text-xl font-bold text-accent">{stats.links}</span>
            </div>
          </div>
        </div>

        {/* Global Graph Container */}
        <div className="w-full h-[calc(100vh-220px)] relative rounded-2xl overflow-hidden border border-glass-border">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-light/50 backdrop-blur-sm z-10">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-text-secondary animate-pulse">Aggregating global ecosystem data...</p>
            </div>
          ) : (
            <>
              <CytoscapeGraph 
                elements={elements} 
                onNodeClick={(node) => console.log("Clicked:", node)} 
              />
              
              {/* Legend overlay */}
              <div className="absolute bottom-4 left-4 px-4 py-3 rounded-xl flex flex-col gap-2"
                style={{ 
                  background: 'rgba(20, 18, 37, 0.85)', 
                  backdropFilter: 'blur(12px)', 
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                <span className="text-xs font-semibold text-white/70 mb-1 uppercase tracking-wide">Topology Legend</span>
                <span className="flex items-center gap-2 text-sm text-white/90"><span className="w-3 h-3 rounded-full bg-[#7F77DD]" /> Innovators / Founders</span>
                <span className="flex items-center gap-2 text-sm text-white/90"><span className="w-3 h-3 rounded-full bg-[#30D1BC]" /> Mentors / Experts</span>
                <span className="flex items-center gap-2 text-sm text-white/90 mt-1"><span className="w-6 h-[2px] bg-[#7F77DD] rounded-full" /> Verified Mentorship Link</span>
                <span className="flex items-center gap-2 text-sm text-white/90"><span className="w-6 h-[2px] rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FFB340 0, #FFB340 4px, transparent 4px, transparent 8px)' }} /> Suggested Mentorship Link</span>
              </div>
            </>
          )}
        </div>
        
      </div>
    </PageWrapper>
  )
}
