'use client';

import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeTypes,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import type { Project, Step } from '@/core/types';
import StepNode, { type StepNodeData } from './StepNode';
import RootNode, { type RootNodeData } from './RootNode';
import DeliveryNode, { type DeliveryNodeData } from './DeliveryNode';

type GraphNodeData = StepNodeData | RootNodeData | DeliveryNodeData;

const ROOT_ID = 'node_root';
const DELIVERY_ID = 'node_delivery';
const STEP_WIDTH = 220;
const STEP_HEIGHT = 88;
const SYNTH_WIDTH = 260;
const SYNTH_HEIGHT = 92;

const NODE_TYPES: NodeTypes = {
  stepNode: StepNode,
  rootNode: RootNode,
  deliveryNode: DeliveryNode,
};

interface GraphCanvasProps {
  project: Project;
  selectedStep: Step | null;
  locale: 'en' | 'ar';
  onSelectStep: (step: Step | null) => void;
}

export function GraphCanvas({ project, selectedStep, locale, onSelectStep }: GraphCanvasProps) {
  const stableNodeTypes = useMemo(() => NODE_TYPES, []);
  const doneCount = project.steps.filter((step) => step.status === 'done').length;
  const percent = project.steps.length > 0
    ? Math.round((doneCount / project.steps.length) * 100)
    : 0;

  const { nodes, edges } = useMemo(
    () => buildGraph(project, selectedStep?.id ?? null, locale, doneCount, percent),
    [project, selectedStep?.id, locale, doneCount, percent],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: RFNode<GraphNodeData>) => {
      if ('step' in node.data) onSelectStep(node.data.step);
    },
    [onSelectStep],
  );

  return (
    <ReactFlow
      className="pg-graph-canvas"
      nodes={nodes}
      edges={edges}
      nodeTypes={stableNodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelectStep(null)}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1.25}
        color="oklch(0.72 0.05 265 / 34%)"
      />
      <Controls
        className="pg-graph-controls"
        showInteractive={false}
      />
      <MiniMap
        className="pg-graph-minimap"
        nodeColor={(node) => {
          if (node.id === ROOT_ID) return 'oklch(0.56 0.22 292)';
          if (node.id === DELIVERY_ID) return 'oklch(0.66 0.16 150)';
          const step = (node.data as Partial<StepNodeData> | undefined)?.step;
          if (!step) return 'oklch(0.8 0.018 260)';
          const map: Record<string, string> = {
            planning: 'oklch(0.56 0.22 292)',
            setup: 'oklch(0.58 0.18 255)',
            implementation: 'oklch(0.66 0.16 150)',
            integration: 'oklch(0.68 0.14 210)',
            verification: 'oklch(0.76 0.16 78)',
            delivery: 'oklch(0.58 0.18 255)',
          };
          return map[step.type] ?? 'oklch(0.8 0.018 260)';
        }}
        maskColor="oklch(0.1 0.02 265 / 46%)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

function buildGraph(
  project: Project,
  selectedStepId: string | null,
  locale: 'en' | 'ar',
  doneCount: number,
  percent: number,
): { nodes: RFNode<GraphNodeData>[]; edges: RFEdge[] } {
  const firstSteps = project.steps.filter((step) => step.dependsOn.length === 0);
  const dependedOn = new Set(project.edges.map((edge) => edge.source));
  const lastSteps = project.steps.filter((step) => !dependedOn.has(step.id));
  const edgeStyle = { stroke: 'oklch(0.72 0.05 265 / 46%)', strokeWidth: 1.6 };
  const edgeMarker = { type: MarkerType.ArrowClosed, color: 'oklch(0.72 0.05 265 / 46%)' };

  const nodes: RFNode<GraphNodeData>[] = [
    {
      id: ROOT_ID,
      type: 'rootNode',
      position: { x: 0, y: 0 },
      data: { name: project.meta.name, idea: project.meta.idea },
      selectable: false,
    },
    ...project.steps.map((step) => ({
      id: step.id,
      type: 'stepNode',
      position: { x: 0, y: 0 },
      data: { step, locale },
      selected: selectedStepId === step.id,
    })),
    {
      id: DELIVERY_ID,
      type: 'deliveryNode',
      position: { x: 0, y: 0 },
      data: { percent, done: doneCount, total: project.steps.length },
      selectable: false,
    },
  ];

  const edges: RFEdge[] = [
    ...firstSteps.map((step) => ({
      id: `${ROOT_ID}->${step.id}`,
      source: ROOT_ID,
      target: step.id,
      type: 'smoothstep',
      style: edgeStyle,
      markerEnd: edgeMarker,
    })),
    ...project.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: edgeStyle,
      markerEnd: edgeMarker,
    })),
    ...lastSteps.map((step) => ({
      id: `${step.id}->${DELIVERY_ID}`,
      source: step.id,
      target: DELIVERY_ID,
      type: 'smoothstep',
      style: edgeStyle,
      markerEnd: edgeMarker,
    })),
  ];

  return layoutVertical(nodes, edges, locale);
}

function layoutVertical(
  nodes: RFNode<GraphNodeData>[],
  edges: RFEdge[],
  locale: 'en' | 'ar',
): { nodes: RFNode<GraphNodeData>[]; edges: RFEdge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });

  for (const node of nodes) {
    const width = node.id === ROOT_ID || node.id === DELIVERY_ID ? SYNTH_WIDTH : STEP_WIDTH;
    const height = node.id === ROOT_ID || node.id === DELIVERY_ID ? SYNTH_HEIGHT : STEP_HEIGHT;
    graph.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const laidOut = nodes.map((node) => {
    const pos = graph.node(node.id);
    const width = node.id === ROOT_ID || node.id === DELIVERY_ID ? SYNTH_WIDTH : STEP_WIDTH;
    const height = node.id === ROOT_ID || node.id === DELIVERY_ID ? SYNTH_HEIGHT : STEP_HEIGHT;
    const x = (pos.x - width / 2) * (locale === 'ar' ? -1 : 1);
    return { ...node, position: { x, y: pos.y - height / 2 } };
  });

  return { nodes: laidOut, edges };
}
