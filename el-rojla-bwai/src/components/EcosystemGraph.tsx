"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

interface Linkage {
  id: string;
  health_score: number;
  grant_lock_status: boolean;
  entity_a: { name: string } | null;
  entity_b: { name: string } | null;
}

interface EcosystemGraphProps {
  linkages: Linkage[];
}

export function EcosystemGraph({ linkages }: EcosystemGraphProps) {
  const { nodes, edges } = useMemo(() => {
    if (!linkages || linkages.length === 0) {
      return { nodes: [], edges: [] };
    }

    const mentorMap = new Map<string, { name: string; count: number }>();
    const companySet = new Map<string, string>();

    // Collect unique mentors and companies from linkages
    linkages.forEach((l) => {
      const mentorName = l.entity_b?.name || "Unknown Mentor";
      const companyName = l.entity_a?.name || "Unknown Company";
      
      if (!mentorMap.has(mentorName)) {
        mentorMap.set(mentorName, { name: mentorName, count: 0 });
      }
      mentorMap.get(mentorName)!.count++;
      companySet.set(`${l.id}-company`, companyName);
    });

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Layout: Mentors on the left, Companies on the right
    const mentorArray = Array.from(mentorMap.entries());
    const mentorSpacing = 150;
    const mentorStartY = Math.max(
      50,
      (linkages.length * 70 - mentorArray.length * mentorSpacing) / 2
    );

    // Create Mentor nodes
    mentorArray.forEach(([name, data], i) => {
      newNodes.push({
        id: `mentor-${name}`,
        position: { x: 50, y: mentorStartY + i * mentorSpacing },
        data: {
          label: `🧙 ${data.name} (${data.count})`,
        },
        style: {
          background: "linear-gradient(135deg, #059669, #0d9488)",
          color: "white",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: "600",
          boxShadow: "0 4px 15px rgba(16,185,129,0.15)",
          width: 180,
        },
        draggable: true,
      });
    });

    // Create Company nodes + Edges
    linkages.forEach((linkage, i) => {
      const companyName = linkage.entity_a?.name || "Unknown";
      const mentorName = linkage.entity_b?.name || "Unknown";
      const companyNodeId = `company-${linkage.id}`;
      const mentorNodeId = `mentor-${mentorName}`;

      // Health-based styling
      const health = linkage.health_score;
      let borderColor = "rgba(16,185,129,0.3)";
      let bgColor = "#1e293b";
      let shadow = "0 4px 15px rgba(30,41,59,0.3)";

      if (health < 80 && health >= 50) {
        borderColor = "rgba(251,191,36,0.3)";
        bgColor = "#292524";
        shadow = "0 4px 15px rgba(251,191,36,0.1)";
      }
      if (health < 50) {
        borderColor = "rgba(244,63,94,0.4)";
        bgColor = "#1c1917";
        shadow = "0 4px 15px rgba(244,63,94,0.15)";
      }

      newNodes.push({
        id: companyNodeId,
        position: { x: 400, y: 30 + i * 70 },
        data: {
          label: `🏢 ${companyName} (${health}%)`,
        },
        style: {
          background: bgColor,
          color: "white",
          border: `1px solid ${borderColor}`,
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "11px",
          fontWeight: "500",
          boxShadow: shadow,
          width: 200,
        },
        draggable: true,
      });

      // Edge
      let edgeColor = "#10b981";
      if (health < 80) edgeColor = "#fbbf24";
      if (health < 50) edgeColor = "#f43f5e";

      newEdges.push({
        id: `edge-${linkage.id}`,
        source: mentorNodeId,
        target: companyNodeId,
        animated: health >= 50,
        style: { stroke: edgeColor, strokeWidth: health < 50 ? 3 : 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [linkages]);

  if (linkages.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-neutral-500 bg-neutral-900/50 border-t border-neutral-800">
        Run the Bipartite Matching Engine to see the ecosystem graph.
      </div>
    );
  }

  return (
    <div className="h-[450px] w-full bg-neutral-950 border-t border-neutral-800">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="#262626" gap={20} size={1} />
        <Controls
          className="bg-neutral-800 border-neutral-700 fill-neutral-400 rounded-lg"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
