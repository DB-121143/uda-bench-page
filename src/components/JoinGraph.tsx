import { memo, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";

export type JoinHub = {
  key: string;
  columns: { id: string; label: string; table?: string }[];
};

export type JoinGraphProps = {
  data: JoinHub[];
  height?: number;
};

type JoinNode = NodeObject & {
  id: string;
  label: string;
  type: "center" | "column";
  table?: string;
  color?: string;
  fx?: number;
  fy?: number;
};

type JoinLink = LinkObject & {
  source: string;
  target: string;
};

const palette = {
  center: "#22d3ee",
  column: "#475569",
  link: "rgba(14,165,233,0.28)",
  linkHighlight: "rgba(59,130,246,0.9)",
  halo: "rgba(125,211,252,0.55)",
};

const JoinGraph = ({ data, height = 420 }: JoinGraphProps) => {
  const ref = useRef<ForceGraphMethods | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>();
  const pulseRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Track container width to prevent canvas overflow on responsive layouts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setWidth(Math.max(260, w));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keep the canvas refreshing so glow/pulse effects animate smoothly
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      pulseRef.current = performance.now();
      const refresh = (ref.current as any)?.refresh as (() => void) | undefined;
      if (typeof refresh === "function") {
        refresh();
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  const tablePalette = useMemo(() => {
    const tables = new Set<string>();
    data.forEach((hub) => hub.columns.forEach((c) => c.table && tables.add(c.table)));
    const swatches = ["#f472b6", "#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#22d3ee"];
    const mapping: Record<string, string> = {};
    Array.from(tables).forEach((name, idx) => {
      mapping[name] = swatches[idx % swatches.length];
    });
    return mapping;
  }, [data]);

  const { nodes, links } = useMemo(() => {
    const n: JoinNode[] = [];
    const l: JoinLink[] = [];
    const colsPerRow = Math.max(2, Math.ceil(Math.sqrt(data.length)));
    const centerSpacing = 420;
    const rowSpacing = 360;
    // Center the grid around origin to reduce drift to a corner
    const startX = -((colsPerRow - 1) * centerSpacing) / 2;
    const startY = -((Math.ceil(data.length / colsPerRow) - 1) * rowSpacing) / 2;
    data.forEach((hub, hubIdx) => {
      const row = Math.floor(hubIdx / colsPerRow);
      const colIdx = hubIdx % colsPerRow;
      const baseX = startX + colIdx * centerSpacing;
      const baseY = startY + row * rowSpacing;
      const centerId = `center-${hub.key}`;
      n.push({ id: centerId, label: hub.key, type: "center", fx: baseX, fy: baseY });
      const total = hub.columns.length;
      const colRadius = Math.min(220, 110 + Math.max(0, total - 4) * 14);
      hub.columns.forEach((col, idx) => {
        const colId = col.id ?? `${hub.key}-${col.label}`;
        const angle = (idx / Math.max(1, total)) * Math.PI * 2;
        const cx = baseX + Math.cos(angle) * colRadius;
        const cy = baseY + Math.sin(angle) * colRadius;
        n.push({
          id: colId,
          label: col.label ?? colId,
          table: col.table,
          type: "column",
          color: col.table ? tablePalette[col.table] : undefined,
          fx: cx,
          fy: cy,
        });
        l.push({ source: centerId, target: colId, curvature: 0.18 });
      });
    });
    return { nodes: n, links: l };
  }, [data, tablePalette]);

  // Freeze simulation: remove forces so layout stays where we place it
  useEffect(() => {
    if (!ref.current) return;
    const fg = ref.current;
    fg.d3Force("charge", null as any);
    fg.d3Force("link", null as any);
    fg.d3Force("center", null as any);
    if (typeof (fg as any).d3VelocityDecay === "function") {
      (fg as any).d3VelocityDecay(1);
    }
    if (typeof (fg as any).d3AlphaDecay === "function") {
      (fg as any).d3AlphaDecay(1);
    }
  }, [nodes, links]);

  // Auto-zoom to show most of the graph on load
  useEffect(() => {
    if (!ref.current || !width || nodes.length === 0) return;
    const handle = requestAnimationFrame(() => {
      ref.current?.zoomToFit(450, 70);
    });
    return () => cancelAnimationFrame(handle);
  }, [width, height, nodes.length]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-xl"
    >
      <div className="relative">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 leading-tight">Join Keys</h2>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">Showing all the attributes used for join.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-2 shadow-inner">
          <ForceGraph2D
            ref={ref as any}
            width={width}
            height={height}
            graphData={{ nodes, links }}
            backgroundColor="rgba(248,250,252,0.65)"
            nodeLabel={(node) => (node as JoinNode).label}
            linkColor={(link) => {
              const srcId = (link.source as any)?.id ?? link.source;
              const tgtId = (link.target as any)?.id ?? link.target;
              const isHoverLink = (ref.current as any)?.__hoverLink === link;
              const touchesHoverNode = hoveredNode != null && (hoveredNode === srcId || hoveredNode === tgtId);
              return isHoverLink || touchesHoverNode ? palette.linkHighlight : palette.link;
            }}
            linkWidth={(link) => {
              const srcId = (link.source as any)?.id ?? link.source;
              const tgtId = (link.target as any)?.id ?? link.target;
              const isHoverLink = (ref.current as any)?.__hoverLink === link;
              const touchesHoverNode = hoveredNode != null && (hoveredNode === srcId || hoveredNode === tgtId);
              return isHoverLink || touchesHoverNode ? 2.8 : 1.4;
            }}
            linkCurvature={(link: any) => link.curvature ?? 0}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2.4}
            linkDirectionalParticleSpeed={() => 0.006}
            linkDirectionalParticleColor={() => palette.linkHighlight}
            nodePointerAreaPaint={(node, color, ctx) => {
              // Expand hit area to full circle plus padding for easier grabs
              const radius = (node as JoinNode).type === "center" ? 22 : 18;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI);
              ctx.fill();
            }}
            nodeCanvasObject={(node, ctx) => {
              const n = node as JoinNode;
              const fontSize = n.type === "center" ? 14 : 12;
              const radius = n.type === "center" ? 16 : 11;
              const isHover = hoveredNode === n.id;
              const x = node.x || 0;
              const y = node.y || 0;
              const pulse = n.type === "center" ? (Math.sin(pulseRef.current / 520) + 1) / 2 : 0;
              const tint = n.color || palette.column;

              // Glow ring for centers
              if (n.type === "center") {
                ctx.beginPath();
                ctx.arc(x, y, radius + 9 + pulse * 6, 0, 2 * Math.PI);
                ctx.strokeStyle = palette.halo;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.75;
                ctx.stroke();
                ctx.globalAlpha = 1;
              }

              // Node circle with neon glow
              ctx.save();
              ctx.beginPath();
              const fill = n.type === "center" ? palette.center : tint;
              const stroke = n.type === "center" ? "#0ea5e9" : `${tint}cc`;
              ctx.shadowColor = fill;
              ctx.shadowBlur = isHover ? 18 : 10;
              ctx.fillStyle = fill;
              ctx.strokeStyle = stroke;
              ctx.lineWidth = isHover ? 2.4 : 1.6;
              ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.stroke();
              ctx.restore();

              // Label
              const label = n.label;
              ctx.font = `${fontSize}px 'Inter', 'Open Sans', sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = n.type === "center" ? "#0b1120" : "#0f172a";
              const text = label.length > 26 ? `${label.slice(0, 24)}…` : label;
              const labelY = n.type === "center" ? y : y + radius + fontSize;
              ctx.fillText(text, x, labelY);
            }}
            linkCanvasObjectMode={() => "after"}
            linkCanvasObject={(_, __) => {
              // Intentionally no label rendering on hover
            }}
            onLinkHover={(link) => {
              (ref.current as any).__hoverLink = link;
            }}
            onNodeHover={(node) => {
              setHoveredNode(node ? (node as JoinNode).id : null);
              (ref.current as any).__hoverNode = node;
            }}
            enableNodeDrag
            onNodeDragEnd={(node) => {
              // Fix node at new position after drag
              node.fx = node.x;
              node.fy = node.y;
            }}
            cooldownTicks={0}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(JoinGraph);
