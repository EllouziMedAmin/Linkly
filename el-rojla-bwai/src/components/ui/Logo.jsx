import React from 'react'

export function Logo({ className = "w-8 h-8" }) {
  return (
    <div className={`${className} flex items-center justify-center overflow-hidden rounded-lg`}>
      <img 
        src="/logo.png" 
        alt="Lyncly Logo" 
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback if logo.png is not found
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<div class="w-full h-full bg-accent flex items-center justify-center text-white font-bold text-xl">L</div>';
        }}
      />
    </div>
  )
}
