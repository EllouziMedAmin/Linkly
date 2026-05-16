import React from 'react'

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div 
      className={`${hover ? 'glass-card' : 'glass-card-static'} ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
}
