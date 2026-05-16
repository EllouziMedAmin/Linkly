import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, Target, Activity } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Navbar } from '../components/layout/Navbar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export default function Landing() {
  return (
    <PageWrapper>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="container-narrow">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-subtle text-accent mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium tracking-wide uppercase">Built with Gemini AI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text-primary mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Stop managing relationships manually.<br />
            <span className="text-accent">Let AI do it.</span>
          </h1>
          
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            The programmable ecosystem platform. We automate registration, scoring, and mentor matching so you never have to touch a spreadsheet again.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth/signup" className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
              Create a Programme
              <ArrowRight size={18} />
            </Link>
            <Link to="/discover" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto">
              Find Programmes
            </Link>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Badge variant="gray" className="px-4 py-1.5 text-sm">Hackathons</Badge>
            <Badge variant="gray" className="px-4 py-1.5 text-sm">Accelerators</Badge>
            <Badge variant="gray" className="px-4 py-1.5 text-sm">Competitions</Badge>
            <Badge variant="gray" className="px-4 py-1.5 text-sm">Grants</Badge>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white/40">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-accent-subtle text-accent flex items-center justify-center mb-6">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Auto-Registration</h3>
              <p className="text-text-secondary">
                Build custom forms instantly. Gemini reads every submission, extracts tags, and scores applicants against your custom criteria automatically.
              </p>
            </Card>

            <Card className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Matching Engine</h3>
              <p className="text-text-secondary">
                Don't guess who fits. Our engine compares every participant against your mentor pool, calculating precise match percentages with reasoning.
              </p>
            </Card>

            <Card className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Engagement Tracking</h3>
              <p className="text-text-secondary">
                See the health of your ecosystem live. Participants and mentors log sessions, building a dynamic network graph of confirmed linkages.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 text-center text-text-secondary text-sm border-t border-glass-border">
        <p>Built for the Cradle Build with AI 2026 Hackathon.</p>
      </footer>
    </PageWrapper>
  )
}
