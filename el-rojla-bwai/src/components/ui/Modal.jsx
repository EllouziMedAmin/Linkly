import React from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`glass-card-static w-full m-4 ${maxWidth} animate-scale-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 transition-colors text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
