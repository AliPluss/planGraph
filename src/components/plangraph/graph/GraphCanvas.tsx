'use client';

import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeTypes,
} from 'reactflow';
import dagre from 'dagre';
import { CheckCircle2, Circle, GitBranch, Layers3, Move, Plus, Workflow } from 'lucide-react';
import 'reactflow/dist/style.css';
import type { Project, Step } from '@/core/types';
import StepNode, { type StepNodeData } from './StepNode';
import RootNode, { type RootNodeData } from './RootNode';
import DeliveryNode, { type DeliveryNodeData } from './DeliveryNode';

type GraphNodeData = StepNodeData | RootNodeData | DeliveryNodeData;

const ROOT_ID = 'node_root';
const DELIVERY_ID = 'node_delivery';
const STEP_WIDTH = 280;
const STEP_HEIGHT = 132;
const SYNTH_WIDTH = 300;
const SYNTH_HEIGHT = 144;

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
      <Panel position="top-left" className="nodrag nopan">
        <GraphNodeRail
          project={project}
          selectedStepId={selectedStep?.id ?? null}
          locale={locale}
          onSelectStep={onSelectStep}
        />
      </Panel>
      <Panel position="top-center" className="nodrag nopan hidden lg:block">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--pg-border-soft)] bg-background/54 p-1.5 shadow-[0_18px_60px_oklch(0.04_0.02_265_/_0.34),inset_0_1px_0_oklch(1_0_0_/_0.05)] backdrop-blur-2xl">
          <button
            type="button"
            disabled
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-xl border border-[var(--pg-border-soft)] bg-background/30 px-3 text-xs font-semibold text-muted-foreground/55"
            title={locale === 'ar' ? 'سيتم تفعيل وضع التحريك في جلسة لاحقة' : 'Pan mode will be enabled in a later session'}
          >
            <Move className="size-4" />
            {locale === 'ar' ? 'تحريك' : 'Pan'}
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-xl border border-[var(--pg-border-soft)] bg-background/30 px-3 text-xs font-semibold text-muted-foreground/55"
            title={locale === 'ar' ? 'التخطيط التلقائي مطبق عند تحميل المخطط' : 'Auto layout is applied when the graph loads'}
          >
            <Workflow className="size-4" />
            {locale === 'ar' ? 'تخطيط تلقائي' : 'Auto layout'}
          </button>
        </div>
      </Panel>
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.05}
        color="oklch(0.72 0.05 265 / 25%)"
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

function GraphNodeRail({
  project,
  selectedStepId,
  locale,
  onSelectStep,
}: {
  project: Project;
  selectedStepId: string | null;
  locale: 'en' | 'ar';
  onSelectStep: (step: Step | null) => void;
}) {
  const labels = {
    en: {
      title: 'Node Types',
      graph: 'Main graph',
      custom: 'Custom node',
      disabled: 'Custom nodes are planned for a later session',
      done: 'done',
    },
    ar: {
      title: 'أنواع العقد',
      graph: 'المخطط الرئيسي',
      custom: 'عقدة مخصصة',
      disabled: 'إضافة العقد المخصصة ستأتي في جلسة لاحقة',
      done: 'مكتملة',
    },
  }[locale];

  return (
    <aside
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="hidden w-64 rounded-2xl border border-[var(--pg-border-soft)] bg-background/58 p-3 shadow-[0_18px_60px_oklch(0.04_0.02_265_/_0.36),inset_0_1px_0_oklch(1_0_0_/_0.05)] backdrop-blur-2xl xl:block"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers3 className="size-4 text-[var(--pg-accent-purple)]" />
          {labels.title}
        </div>
        <span className="rounded-full border border-[var(--pg-border-soft)] bg-background/30 px-2 py-0.5 text-[10px] text-muted-foreground">
          {project.steps.length}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSelectStep(null)}
        className={`mb-2 flex h-9 w-full items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
          selectedStepId === null
            ? 'border-[var(--pg-accent-purple)] bg-[var(--pg-accent-purple)]/16 text-white'
            : 'border-[var(--pg-border-soft)] bg-background/24 text-muted-foreground hover:bg-muted/35 hover:text-foreground'
        }`}
      >
        <GitBranch className="size-4" />
        {labels.graph}
      </button>
      <div className="max-h-[56vh] space-y-1.5 overflow-y-auto pe-1">
        {project.steps.map((step, index) => {
          const done = step.status === 'done';
          return (
            <button
              type="button"
              key={step.id}
              onClick={() => onSelectStep(step)}
              className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-start text-xs transition ${
                selectedStepId === step.id
                  ? 'border-[var(--pg-accent-blue)] bg-[var(--pg-accent-blue)]/14 text-white shadow-[0_0_18px_oklch(0.58_0.18_255_/_0.18)]'
                  : 'border-[var(--pg-border-soft)] bg-background/18 text-muted-foreground hover:border-[var(--pg-border-strong)] hover:text-foreground'
              }`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background/40 text-[var(--pg-accent-cyan)]">
                {done ? <CheckCircle2 className="size-4 text-[var(--pg-accent-green)]" /> : <Circle className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{step.title}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                  ID: {String(index + 1).padStart(2, '0')} · {done ? labels.done : step.type}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled
        title={labels.disabled}
        className="mt-3 flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--pg-border-soft)] bg-background/20 text-xs font-semibold text-muted-foreground/55"
      >
        <Plus className="size-4" />
        {labels.custom}
      </button>
    </aside>
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
  const edgeStyle = { stroke: 'oklch(0.78 0.045 265 / 56%)', strokeWidth: 2 };
  const edgeMarker = { type: MarkerType.ArrowClosed, color: 'oklch(0.78 0.045 265 / 56%)' };

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
  graph.setGraph({ rankdir: 'TB', ranksep: 86, nodesep: 56 });

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
