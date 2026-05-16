"use client";

import React, { useMemo, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

interface Linkage {
  id: string;
  health_score: number;
  friction_allocation: number;
  grant_lock_status: boolean;
  entity_a: { name: string } | null;
  entity_b: { name: string } | null;
}

// ─── Custom nodes ─────────────────────────────────────────────────────────────

function MentorNode({ data }: NodeProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
        border: "2px solid rgba(99,102,241,0.5)",
        boxShadow: "0 0 16px rgba(99,102,241,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, userSelect: "none", zIndex: 10
      }}>🧠</div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#e2e8f0",
        background: "rgba(15,23,42,0.85)", backdropFilter: "blur(4px)",
        border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6,
        padding: "2px 6px", minWidth: 80, textAlign: "center",
      }}>{data.label}</div>
    </div>
  );
}

function CompanyNode({ data }: NodeProps) {
  const health = data.health as number;
  const locked = data.locked as boolean;
  const color = locked ? "#f43f5e" : health >= 80 ? "#10b981" : health >= 50 ? "#fbbf24" : "#f43f5e";
  const emoji = locked ? "🔒" : health >= 80 ? "🏢" : health >= 50 ? "🏗️" : "⚠️";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "#0f172a",
        border: `2px solid ${color}`,
        boxShadow: `0 0 16px ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, userSelect: "none", zIndex: 10
      }}>{emoji}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#e2e8f0",
        background: "rgba(15,23,42,0.85)", backdropFilter: "blur(4px)",
        border: `1px solid ${color}40`, borderRadius: 6,
        padding: "2px 6px", minWidth: 80, textAlign: "center",
      }}>{data.label}</div>
    </div>
  );
}

// ─── Network Mesh Layout ──────────────────────────────────────────────────────

// Deterministic pseudo-random number generator
function prng(seed: number) {
  let t = seed + 1;
  t ^= t << 13;
  t ^= t >> 17;
  t ^= t << 5;
  return (t >>> 0) / 4294967296;
}

function buildGraph(linkages: Linkage[]): { nodes: Node[]; edges: Edge[] } {
  if (!linkages || linkages.length === 0) return { nodes: [], edges: [] };

  const mentorMap = new Map<string, { name: string; count: number }>();
  linkages.forEach((l) => {
    const name = l.entity_b?.name || "Unknown Mentor";
    if (!mentorMap.has(name)) mentorMap.set(name, { name, count: 0 });
    mentorMap.get(name)!.count++;
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const mentorArray = Array.from(mentorMap.entries());
  
  const centerX = 600;
  const centerY = 400;

  // Mentors clustered tightly in the center
  mentorArray.forEach(([name, data], i) => {
    const angle = i * 2.39996;
    const radius = Math.sqrt(i) * 35; // tightly packed inner cluster
    
    const jitterX = (prng(i) - 0.5) * 40;
    const jitterY = (prng(i + 1000) - 0.5) * 40;
    
    const x = centerX + Math.cos(angle) * radius + jitterX;
    const y = centerY + Math.sin(angle) * radius + jitterY;

    nodes.push({
      id: `mentor-${name}`,
      type: "mentor",
      position: { x, y },
      data: { label: data.name, count: data.count },
      draggable: true,
    });
  });

  // Companies orbiting in a wide outer ring
  linkages.forEach((linkage, i) => {
    const companyName = linkage.entity_a?.name || "Unknown";
    const companyId = `company-${linkage.id}`;
    
    const angle = i * 2.39996;
    const radius = 320 + Math.sqrt(i) * 30; // outer orbit
    
    const jitterX = (prng(i + 2000) - 0.5) * 80;
    const jitterY = (prng(i + 3000) - 0.5) * 80;
    
    const x = centerX + Math.cos(angle) * radius + jitterX;
    const y = centerY + Math.sin(angle) * radius + jitterY;

    nodes.push({
      id: companyId,
      type: "company",
      position: { x, y },
      data: { label: companyName, health: linkage.health_score, locked: linkage.grant_lock_status },
      draggable: true,
    });
  });

  // Build edges like a web across the gap
  linkages.forEach((linkage) => {
    const mentorName = linkage.entity_b?.name || "Unknown";
    const mentorId = `mentor-${mentorName}`;
    const companyId = `company-${linkage.id}`;
    const health = linkage.health_score;
    const locked = linkage.grant_lock_status;

    const color = locked ? "#f43f5e" : health >= 80 ? "#10b981" : health >= 50 ? "#fbbf24" : "#f43f5e";

    edges.push({
      id: `edge-${linkage.id}`,
      source: mentorId,
      target: companyId,
      type: "straight",
      animated: !locked && health >= 50,
      style: {
        stroke: color,
        strokeWidth: 1.5,
        opacity: 0.5, // Make transparent so the overlapping web looks good
        filter: health >= 80 ? `drop-shadow(0 0 2px ${color})` : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 8, height: 8 },
    });
  });

  return { nodes, edges };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function EcosystemGraph({ linkages }: { linkages: Linkage[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const nodeTypes = useMemo(() => ({ mentor: MentorNode, company: CompanyNode }), []);

  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(linkages);
    setNodes(n);
    setEdges(e);
  }, [linkages, setNodes, setEdges]);

  if (!linkages || linkages.length === 0) {
    return (
      <div style={{ height: 200, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(2,6,23,0.6)", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {["🧠", "🧠", "🏢", "🏢", "🏢"].map((e, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: "50%", background: "#0f172a", border: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, opacity: 0.35 + i * 0.12 }}>{e}</div>
          ))}
        </div>
        <p style={{ color: "#475569", fontSize: 12 }}>Run Bipartite Matching to populate the ecosystem graph</p>
      </div>
    );
  }

  return (
    <div style={{ height: 650, width: "100%", background: "#020617", borderTop: "1px solid #1e293b" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#0f172a" gap={30} size={1} />
        <Controls
          style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
