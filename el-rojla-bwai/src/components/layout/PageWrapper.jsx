import React from 'react'

export function PageWrapper({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-bg-light mesh-gradient flex flex-col ${className}`}>
      <main className="flex-1 page-enter">
        {children}
      </main>
    </div>
  )
}
