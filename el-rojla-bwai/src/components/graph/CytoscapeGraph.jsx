import React, { useEffect, useRef, useState, useCallback } from 'react'
import cytoscape from 'cytoscape'

export function CytoscapeGraph({ elements, onNodeClick }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const minZoomRef = useRef(null)

  // Floating detail tooltip state
  const [tooltip, setTooltip] = useState(null)

  // ---- Animated dark background ----
  const drawBackground = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio
    const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const cw = canvas.offsetWidth
    const ch = canvas.offsetHeight

    // Dark gradient background
    const grad = ctx.createRadialGradient(cw * 0.3, ch * 0.3, 0, cw * 0.5, ch * 0.5, cw * 0.8)
    grad.addColorStop(0, '#1a1830')
    grad.addColorStop(0.5, '#141225')
    grad.addColorStop(1, '#0e0c1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, cw, ch)

    const t = Date.now() * 0.0003

    // Purple glow
    const g1 = ctx.createRadialGradient(
      cw * (0.25 + Math.sin(t) * 0.1),
      ch * (0.4 + Math.cos(t * 0.7) * 0.1),
      0, cw * 0.3, ch * 0.4, cw * 0.35
    )
    g1.addColorStop(0, 'rgba(127, 119, 221, 0.08)')
    g1.addColorStop(1, 'transparent')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, cw, ch)

    // Teal glow
    const g2 = ctx.createRadialGradient(
      cw * (0.7 + Math.cos(t * 1.1) * 0.08),
      ch * (0.3 + Math.sin(t * 0.9) * 0.08),
      0, cw * 0.7, ch * 0.3, cw * 0.3
    )
    g2.addColorStop(0, 'rgba(48, 209, 188, 0.06)')
    g2.addColorStop(1, 'transparent')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, cw, ch)

    // Subtle grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
    const spacing = 40
    for (let x = spacing; x < cw; x += spacing) {
      for (let y = spacing; y < ch; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    animRef.current = requestAnimationFrame(drawBackground)
  }, [])

  useEffect(() => {
    drawBackground()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [drawBackground])

  // ---- Cytoscape Init ----
  useEffect(() => {
    if (!containerRef.current) return

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        // ---- Tiny round vertex nodes ----
        {
          selector: 'node',
          style: {
            'width': 12,
            'height': 12,
            'shape': 'ellipse',
            'background-color': 'data(color)',
            'border-width': 1.5,
            'border-color': 'data(borderColor)',
            'border-opacity': 0.7,
            'label': 'data(label)',
            'color': 'rgba(255, 255, 255, 0.6)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 4,
            'font-size': '7px',
            'font-family': 'Inter, -apple-system, sans-serif',
            'font-weight': 500,
            'text-max-width': '60px',
            'text-wrap': 'ellipsis',
            'text-outline-color': 'rgba(14, 12, 26, 0.7)',
            'text-outline-width': 1,
            'text-outline-opacity': 1,
            'overlay-opacity': 0,
            'transition-property': 'width, height, border-width, border-color, opacity, background-color',
            'transition-duration': '0.2s'
          }
        },
        // Participant-specific glow
        {
          selector: 'node[type="participant"]',
          style: {
            'background-color': '#7F77DD',
            'border-color': 'rgba(127, 119, 221, 0.35)',
          }
        },
        // Unmatched participant (red ring)
        {
          selector: 'node[type="participant"][borderWidth > 0]',
          style: {
            'background-color': '#3a3456',
            'border-color': '#FF453A',
            'border-width': 2,
            'border-opacity': 0.7
          }
        },
        // Mentor-specific
        {
          selector: 'node[type="mentor"]',
          style: {
            'background-color': '#30D1BC',
            'border-color': 'rgba(48, 209, 188, 0.35)',
          }
        },
        // ---- Edge Styles ----
        {
          selector: 'edge',
          style: {
            'width': (ele) => {
              const score = ele.data('score')
              return score ? Math.max(1, (score / 100) * 3) : 1
            },
            'line-color': 'rgba(127, 119, 221, 0.3)',
            'target-arrow-color': 'rgba(127, 119, 221, 0.5)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.5,
            'curve-style': 'bezier',
            'opacity': 0.5,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': '0.25s'
          }
        },
        // Suggested edges
        {
          selector: 'edge[status="suggested"]',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'line-color': 'rgba(255, 179, 64, 0.3)',
            'target-arrow-color': 'rgba(255, 179, 64, 0.4)',
            'opacity': 0.4
          }
        },
        // ---- Hover: subtle glow up ----
        {
          selector: 'node.hover',
          style: {
            'width': 16,
            'height': 16,
            'border-width': 2
          }
        },
        // ---- Dim/highlight for neighbor focus ----
        {
          selector: 'node.dimmed',
          style: {
            'opacity': 0.15
          }
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.06
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'opacity': 1
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#7F77DD',
            'target-arrow-color': '#7F77DD',
            'opacity': 0.9,
            'width': 2.5
          }
        },
        // ---- Selected node (clicked) ----
        {
          selector: 'node.selected-node',
          style: {
            'width': 20,
            'height': 20,
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.9
          }
        }
      ],
      layout: {
        name: 'concentric',
        concentric: (node) => {
          return node.data('type') === 'mentor' ? 2 : 1
        },
        levelWidth: () => 1,
        padding: 80,
        animate: true,
        animationDuration: 800,
        animationEasing: 'ease-out-cubic',
        minNodeSpacing: 20,
        spacingFactor: 0.8,
        nodeDimensionsIncludeLabels: true,
        fit: true
      },
      // Panning allowed, zooming allowed, but we'll clamp minZoom after layout
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabifyNodes: true,   // Nodes CANNOT be dragged
      minZoom: 0.2,               // Temporary — will be locked after layout
      maxZoom: 3,
      wheelSensitivity: 0.2
    })

    const cy = cyRef.current

    // After initial layout completes, lock the zoom floor to current level
    cy.one('layoutstop', () => {
      cy.fit(undefined, 100)      // Fit everything with generous padding
      const fitZoom = cy.zoom()
      minZoomRef.current = fitZoom
      cy.minZoom(fitZoom)         // Can only zoom IN from here
    })

    // ---- Hover: highlight neighborhood ----
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target
      node.addClass('hover')
      cy.elements().addClass('dimmed')
      node.removeClass('dimmed').addClass('highlighted')
      node.connectedEdges().removeClass('dimmed').addClass('highlighted')
      node.neighborhood('node').removeClass('dimmed').addClass('highlighted')
      containerRef.current.style.cursor = 'pointer'
    })

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('hover dimmed highlighted')
      containerRef.current.style.cursor = 'default'
    })

    // ---- Click: show detail tooltip + fire onNodeClick ----
    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const data = node.data()

      // Highlight the clicked node
      cy.elements().removeClass('selected-node dimmed highlighted')
      cy.elements().addClass('dimmed')
      node.removeClass('dimmed').addClass('selected-node highlighted')
      node.connectedEdges().removeClass('dimmed').addClass('highlighted')
      node.neighborhood('node').removeClass('dimmed').addClass('highlighted')

      // Get rendered position for tooltip
      const pos = node.renderedPosition()
      setTooltip({ data, x: pos.x, y: pos.y })

      if (onNodeClick) onNodeClick(data)
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('selected-node dimmed highlighted')
        setTooltip(null)
        if (onNodeClick) onNodeClick(null)
      }
    })

    // Update tooltip position on pan/zoom
    cy.on('pan zoom', () => {
      setTooltip(prev => {
        if (!prev) return null
        const node = cy.getElementById(prev.data.id)
        if (!node || node.empty()) return null
        const pos = node.renderedPosition()
        return { ...prev, x: pos.x, y: pos.y }
      })
    })

    return () => {
      if (cyRef.current) cyRef.current.destroy()
    }
  }, [])

  // ---- Update elements when data changes ----
  useEffect(() => {
    if (cyRef.current && elements) {
      setTooltip(null)
      cyRef.current.elements().remove()
      cyRef.current.add(elements)

      const layout = cyRef.current.layout({
        name: 'concentric',
        concentric: (node) => {
          return node.data('type') === 'mentor' ? 2 : 1
        },
        levelWidth: () => 1,
        padding: 80,
        animate: true,
        animationDuration: 800,
        animationEasing: 'ease-out-cubic',
        minNodeSpacing: 20,
        spacingFactor: 0.8,
        nodeDimensionsIncludeLabels: true,
        fit: true
      })

      // Re-lock zoom floor after re-layout
      cyRef.current.one('layoutstop', () => {
        cyRef.current.fit(undefined, 100)
        const fitZoom = cyRef.current.zoom()
        minZoomRef.current = fitZoom
        cyRef.current.minZoom(fitZoom)
      })

      layout.run()
    }
  }, [elements])

  // ---- Build tooltip content ----
  const renderTooltip = () => {
    if (!tooltip) return null
    const { data, x, y } = tooltip
    const isParticipant = data.type === 'participant'
    const accentColor = isParticipant ? '#7F77DD' : '#30D1BC'
    const accentBg = isParticipant ? 'rgba(127,119,221,0.12)' : 'rgba(48,209,188,0.12)'
    const roleLabel = isParticipant ? (data.profile_type || 'Participant') : 'Mentor'
    const tags = (data.ai_tags || data.expertise_tags || []).slice(0, 4)
    const summary = data.ai_summary || data.bio || null
    const initials = (data.label || '??').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

    return (
      <div
        className="absolute pointer-events-none animate-fade-in"
        style={{
          left: x,
          top: y - 12,
          transform: 'translate(-50%, -100%)',
          zIndex: 50,
          maxWidth: 280,
          minWidth: 200
        }}
      >
        <div
          style={{
            background: 'rgba(20, 18, 37, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '16px',
            boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${accentColor}22`
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${isParticipant ? '#B8B0FF' : '#7EEAD9'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
              flexShrink: 0,
              boxShadow: `0 0 12px ${accentColor}44`
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.label}
              </div>
              <div style={{
                display: 'inline-block', marginTop: 3,
                padding: '2px 8px', borderRadius: 999,
                background: accentBg, color: accentColor,
                fontSize: 9, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div style={{
              color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 1.5,
              fontFamily: 'Inter, sans-serif', marginBottom: 10,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {summary}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 9, fontWeight: 500, fontFamily: 'Inter, sans-serif'
                }}>
                  {String(tag).substring(0, 14)}
                </span>
              ))}
            </div>
          )}

          {/* Score (if participant) */}
          {data.ai_score != null && (
            <div style={{
              marginTop: 10, paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>AI SCORE</span>
              <span style={{
                color: data.ai_score >= 70 ? '#34C759' : data.ai_score >= 40 ? '#FFB340' : '#FF453A',
                fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif'
              }}>
                {data.ai_score}
              </span>
            </div>
          )}
        </div>

        {/* Arrow pointer */}
        <div style={{
          width: 0, height: 0, margin: '0 auto',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgba(20, 18, 37, 0.92)'
        }} />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ cursor: 'default' }}>
      {/* Animated dark background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      {/* Cytoscape container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Floating detail tooltip */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {renderTooltip()}
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(14, 12, 26, 0.4) 100%)'
        }}
      />
    </div>
  )
}
