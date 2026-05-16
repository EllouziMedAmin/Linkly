import React, { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'

export function CytoscapeGraph({ elements, onNodeClick }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 48,
            'height': 48,
            'background-color': 'data(color)',
            'color': '#1D1D1F',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'font-size': '12px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 500,
            'border-width': 'data(borderWidth)',
            'border-color': 'data(borderColor)',
            'transition-property': 'background-color, line-color, target-arrow-color, width, height',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 'data(width)',
            'line-color': '#AEAEB2',
            'target-arrow-color': '#AEAEB2',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#7F77DD',
            'width': 56,
            'height': 56
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#7F77DD',
            'target-arrow-color': '#7F77DD',
            'opacity': 1,
            'width': 4
          }
        }
      ],
      layout: {
        name: 'cose', // Force-directed layout
        padding: 50,
        animate: true,
        animationDuration: 500,
        nodeRepulsion: 400000,
        idealEdgeLength: 150
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    })

    // Event listeners
    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target
      
      // Reset highlights
      cyRef.current.elements().removeClass('highlighted')
      
      // Highlight connected edges
      node.connectedEdges().addClass('highlighted')

      if (onNodeClick) {
        onNodeClick(node.data())
      }
    })

    cyRef.current.on('tap', (evt) => {
      if (evt.target === cyRef.current) {
        cyRef.current.elements().removeClass('highlighted')
        if (onNodeClick) {
          onNodeClick(null)
        }
      }
    })

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
      }
    }
  }, []) // Initialize once

  // Update elements when they change
  useEffect(() => {
    if (cyRef.current && elements) {
      cyRef.current.elements().remove()
      cyRef.current.add(elements)
      cyRef.current.layout({
        name: 'cose',
        padding: 50,
        animate: true,
        animationDuration: 500
      }).run()
    }
  }, [elements])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-white/30 rounded-2xl border border-glass-border overflow-hidden" 
    />
  )
}
