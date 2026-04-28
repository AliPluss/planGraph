'use client';

import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge as RFEdge,
  type EdgeTypes,
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
const STEP_HEIGHT = 72;
const SYNTH_WIDTH = 260;
const SYNTH_HEIGHT = 80;

const nodeTypes: NodeTypes = {
  stepNode: StepNode,
  rootNode: RootNode,
  deliveryNode: DeliveryNode,
};
const edgeTypes: EdgeTypes = {};

interface GraphCanvasProps {
  project: Project;
  selectedStep: Step | null;
  locale: 'en' | 'ar';
  onSelectStep: (step: Step | null) => void;
}

export function GraphCanvas({ project, selectedStep, locale, onSelectStep }: GraphCanvasProps) {
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
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelectStep(null)}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(node) => {
          if (node.id === ROOT_ID) return '#8b5cf6';
          if (node.id === DELIVERY_ID) return '#10b981';
          const step = (node.data as Partial<StepNodeData> | undefined)?.step;
          if (!step) return '#e5e7eb';
          const map: Record<string, string> = {
            planning: '#a855f7',
            setup: '#3b82f6',
            implementation: '#10b981',
            integration: '#06b6d4',
            verification: '#f59e0b',
            delivery: '#6366f1',
          };
          return map[step.type] ?? '#e5e7eb';
        }}
        maskColor="rgba(0,0,0,0.06)"
        style={{ borderRadius: 8, border: '1px solid var(--border)' }}
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
      style: { stroke: 'var(--border)', strokeWidth: 1.5 },
    })),
    ...project.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: { stroke: 'var(--border)', strokeWidth: 1.5 },
    })),
    ...lastSteps.map((step) => ({
      id: `${step.id}->${DELIVERY_ID}`,
      source: step.id,
      target: DELIVERY_ID,
      type: 'smoothstep',
      style: { stroke: 'var(--border)', strokeWidth: 1.5 },
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
