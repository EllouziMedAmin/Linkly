import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Calendar, Users, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export default function Discover() {
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchProgrammes()
  }, [])

  const fetchProgrammes = async () => {
    try {
      const { data, error } = await supabase
        .from('programmes')
        .select('*')
        .in('status', ['open', 'active'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setProgrammes(data || [])
    } catch (err) {
      console.error('Error fetching programmes:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProgrammes = programmes.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = activeFilter === 'all' || p.category?.toLowerCase() === activeFilter.toLowerCase()
    return matchesSearch && matchesFilter
  })

  return (
    <PageWrapper>
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-white/40 border-b border-glass-border">
        <div className="container-wide py-12">
          <h1 className="text-3xl font-bold mb-4">Discover Programmes</h1>
          <p className="text-text-secondary max-w-2xl mb-8">
            Find and apply to world-class hackathons, accelerators, and grants.
            Our AI ensures you get matched with the right mentors instantly.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Search programmes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-glass pl-11 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full no-scrollbar">
              <div className="flex items-center gap-2 px-3 py-2 border-r border-glass-border">
                <Filter size={16} className="text-text-secondary" />
                <span className="text-sm font-medium text-text-secondary">Filters:</span>
              </div>
              {['all', 'hackathon', 'accelerator', 'competition', 'grant'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter 
                      ? 'bg-accent text-white' 
                      : 'bg-white/60 hover:bg-white text-text-secondary'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="container-wide py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-0 overflow-hidden">
                <div className="h-48 skeleton rounded-none" />
                <div className="p-6">
                  <div className="h-6 w-3/4 skeleton mb-4" />
                  <div className="h-4 w-full skeleton mb-2" />
                  <div className="h-4 w-5/6 skeleton mb-6" />
                  <div className="flex gap-2">
                    <div className="h-8 w-24 skeleton rounded-full" />
                    <div className="h-8 w-24 skeleton rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProgrammes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-text-tertiary" size={24} />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-1">No programmes found</h3>
            <p className="text-text-secondary">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProgrammes.map((p, i) => (
              <Card key={p.id} className="flex flex-col h-full animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div 
                  className="h-48 rounded-t-[18px] bg-cover bg-center border-b border-glass-border relative"
                  style={{ 
                    backgroundImage: p.cover_image_url ? `url(${p.cover_image_url})` : 'none',
                    backgroundColor: p.cover_image_url ? 'transparent' : 'rgba(127, 119, 221, 0.1)' 
                  }}
                >
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="gray" className="bg-white/90 backdrop-blur-md">
                      {p.category}
                    </Badge>
                    {p.selection_type === 'ai_selected' ? (
                      <Badge variant="purple" className="bg-accent/90 text-white backdrop-blur-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        AI Selected
                      </Badge>
                    ) : (
                      <Badge variant="teal" className="bg-teal-500/90 text-white backdrop-blur-md">
                        First Come First Served
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{p.title}</h3>
                  <p className="text-text-secondary text-sm mb-6 line-clamp-3 flex-1">
                    {p.description}
                  </p>
                  
                  <div className="flex flex-col gap-2 mb-6 text-sm text-text-secondary">
                    {p.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Deadline: {new Date(p.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {p.max_participants && (
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>{p.max_participants} spots available</span>
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/programme/${p.id}`} className="btn-primary w-full text-sm py-2.5">
                    View Details
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
