import React from 'react'
import { X } from 'lucide-react'

export function Drawer({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel flex flex-col">
        <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between sticky top-0 bg-bg-light/80 backdrop-blur-md z-10">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 flex-1">
          {children}
        </div>
      </div>
    </>
  )
}
