'use client';

import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  applyNodeChanges,
  useReactFlow,
  useEdgesState,
  useNodesState,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeChange,
  type NodeTypes,
} from 'reactflow';
import {
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  GitBranch,
  Move,
  Plus,
  Sparkles,
  Workflow,
} from 'lucide-react';
import 'reactflow/dist/style.css';
import type { Project, Step } from '@/core/types';
import StepNode, { getRoleVisual, getStepRoleIcon, getStepVisual, type StepNodeData, type StepVisualRole } from './StepNode';
import RootNode, { type RootNodeData } from './RootNode';
import DeliveryNode, { type DeliveryNodeData } from './DeliveryNode';

type GraphNodeData = StepNodeData | RootNodeData | DeliveryNodeData;

const ROOT_ID = 'node_root';
const DELIVERY_ID = 'node_delivery';
const STEP_WIDTH = 320;
const STEP_HEIGHT = 152;
const SYNTH_WIDTH = 340;
const SYNTH_HEIGHT = 142;

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
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [activeRole, setActiveRole] = useState<StepVisualRole | null>(null);
  const [layoutCycle, setLayoutCycle] = useState(0);
  const manualPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const dragNodeRef = useRef<string | null>(null);
  const doneCount = project.steps.filter((step) => step.status === 'done').length;
  const percent = project.steps.length > 0
    ? Math.round((doneCount / project.steps.length) * 100)
    : 0;

  const graph = useMemo(
    () => buildGraph(project, locale, doneCount, percent, activeRole, layoutCycle),
    [project, locale, doneCount, percent, activeRole, layoutCycle],
  );
  const [nodes, setNodes] = useNodesState<GraphNodeData>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  const applyNodesWithManualPositions = useCallback((nextNodes: RFNode<GraphNodeData>[]) => (
    nextNodes.map((node) => ({
      ...node,
      position: manualPositionsRef.current.get(node.id) ?? node.position,
    }))
  ), []);

  useEffect(() => {
    setNodes(applyNodesWithManualPositions(graph.nodes));
    setEdges(graph.edges);
  }, [applyNodesWithManualPositions, graph.nodes, graph.edges, setEdges, setNodes]);

  useEffect(() => {
    setNodes((currentNodes) => currentNodes.map((node) => ({
      ...node,
      selected: selectedStep?.id === node.id,
    })));
  }, [selectedStep?.id, setNodes]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((currentNodes) => {
      const changedNodes = applyNodeChanges(changes, currentNodes);
      changedNodes.forEach((node) => {
        const positionChange = changes.find((change) => change.type === 'position' && change.id === node.id);
        if (positionChange && node.position) {
          manualPositionsRef.current.set(node.id, node.position);
        }
      });
      return changedNodes;
    });
  }, [setNodes]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: RFNode<GraphNodeData>) => {
      if (dragNodeRef.current === node.id) {
        dragNodeRef.current = null;
        return;
      }
      if ('step' in node.data) onSelectStep(node.data.step);
    },
    [onSelectStep],
  );

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: RFNode<GraphNodeData>) => {
    manualPositionsRef.current.set(node.id, node.position);
    dragNodeRef.current = node.id;
    window.setTimeout(() => {
      if (dragNodeRef.current === node.id) dragNodeRef.current = null;
    }, 120);
  }, []);

  return (
    <ReactFlow
      className="pg-graph-canvas"
      nodes={nodes}
      edges={edges}
      nodeTypes={stableNodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onNodeDragStart={(_, node) => {
        dragNodeRef.current = node.id;
      }}
      onNodeDragStop={handleNodeDragStop}
      onPaneClick={() => onSelectStep(null)}
      fitView
      fitViewOptions={{ padding: 0.16, minZoom: 0.72, maxZoom: 1.12 }}
      defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
      minZoom={0.34}
      maxZoom={2}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      panOnDrag={interactionMode === 'pan' ? true : [1, 2]}
      panOnScroll={interactionMode === 'pan'}
      zoomOnScroll={interactionMode === 'select'}
      zoomOnPinch
      zoomOnDoubleClick={false}
      preventScrolling={false}
      nodeDragThreshold={2}
      selectionOnDrag={false}
      selectNodesOnDrag={false}
      proOptions={{ hideAttribution: true }}
    >
      <Panel position="top-left" className="nodrag nopan">
        <GraphNodeRail
          project={project}
          selectedStepId={selectedStep?.id ?? null}
          locale={locale}
          onSelectStep={onSelectStep}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
        />
      </Panel>
      <Panel position="top-center" className="nodrag nopan hidden lg:block">
        <GraphToolbar
          locale={locale}
          mode={interactionMode}
          onModeChange={setInteractionMode}
          onAutoLayout={() => {
            manualPositionsRef.current.clear();
            setLayoutCycle((value) => value + 1);
          }}
        />
      </Panel>
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="oklch(0.72 0.03 265 / 12%)"
      />
      <Controls
        className="pg-graph-controls"
        showInteractive={false}
      />
      <MiniMap
        className="pg-graph-minimap"
        style={{ background: 'oklch(0.1 0.03 265)' }}
        nodeColor={(node) => {
          if (node.id === ROOT_ID) return 'oklch(0.68 0.13 292)';
          if (node.id === DELIVERY_ID) return 'oklch(0.69 0.11 150)';
          const step = (node.data as Partial<StepNodeData> | undefined)?.step;
          if (!step) return 'oklch(0.8 0.018 260)';
          return getStepVisual(step).minimap;
        }}
        maskColor="oklch(0.08 0.025 265 / 56%)"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

function GraphToolbar({
  locale,
  mode,
  onModeChange,
  onAutoLayout,
}: {
  locale: 'en' | 'ar';
  mode: 'select' | 'pan';
  onModeChange: (mode: 'select' | 'pan') => void;
  onAutoLayout: () => void;
}) {
  const reactFlow = useReactFlow();

  const fitGraph = useCallback(() => {
    onAutoLayout();
    window.requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.16, duration: 520, minZoom: 0.72, maxZoom: 1.12 });
    });
  }, [onAutoLayout, reactFlow]);

  const controlClass = (active: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${
      active
        ? 'bg-[linear-gradient(135deg,oklch(0.55_0.1_292),oklch(0.52_0.09_255))] text-white shadow-[0_0_18px_oklch(0.5_0.1_292_/_0.22)]'
        : 'border border-white/10 bg-background/30 text-muted-foreground hover:border-white/20 hover:bg-muted/35 hover:text-foreground'
    }`;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[oklch(0.105_0.026_265_/_0.86)] p-1.5 shadow-[0_16px_48px_oklch(0.03_0.02_265_/_0.34),inset_0_1px_0_oklch(1_0_0_/_0.06)] backdrop-blur-2xl">
      <button type="button" onClick={() => onModeChange('select')} aria-pressed={mode === 'select'} className={controlClass(mode === 'select')}>
        <Sparkles className="size-4" />
        {locale === 'ar' ? 'تحديد' : 'Select'}
      </button>
      <button type="button" onClick={() => onModeChange('pan')} aria-pressed={mode === 'pan'} className={controlClass(mode === 'pan')}>
        <Move className="size-4" />
        {locale === 'ar' ? 'تحريك' : 'Pan'}
      </button>
      <button type="button" onClick={fitGraph} className={controlClass(false)}>
        <Workflow className="size-4" />
        {locale === 'ar' ? 'تخطيط تلقائي' : 'Auto layout'}
      </button>
    </div>
  );
}

function GraphNodeRail({
  project,
  selectedStepId,
  locale,
  onSelectStep,
  activeRole,
  onRoleChange,
}: {
  project: Project;
  selectedStepId: string | null;
  locale: 'en' | 'ar';
  onSelectStep: (step: Step | null) => void;
  activeRole: StepVisualRole | null;
  onRoleChange: (role: StepVisualRole | null) => void;
}) {
  const reactFlow = useReactFlow();
  const labels = {
    en: {
      title: 'Node Types',
      graph: 'Main graph',
      custom: 'Custom node',
      disabled: 'Custom nodes are planned for a later session',
      done: 'done',
      categories: {
        planning: 'Idea',
        data: 'Data',
        research: 'Research',
        analysis: 'Analysis',
        design: 'Design',
        tool: 'Tools',
        execution: 'Execution',
        evaluation: 'Review',
        delivery: 'Delivery',
      },
    },
    ar: {
      title: 'أنواع العقد',
      graph: 'المخطط الرئيسي',
      custom: 'عقدة مخصصة',
      disabled: 'إضافة العقد المخصصة ستأتي في جلسة لاحقة',
      done: 'مكتملة',
      categories: {
        planning: 'الفكرة',
        data: 'البيانات',
        research: 'البحث',
        analysis: 'التحليل',
        design: 'التصميم',
        tool: 'الأدوات',
        execution: 'التنفيذ',
        evaluation: 'المراجعة',
        delivery: 'التسليم',
      },
    },
  }[locale];
  const visibleRoles = Array.from(new Set(project.steps.map((step) => getStepVisual(step).role)));
  const roleOrder: StepVisualRole[] = ['planning', 'data', 'research', 'analysis', 'design', 'tool', 'execution', 'evaluation', 'delivery'];
  const roles = roleOrder.filter((role) => visibleRoles.includes(role));
  const focusNodes = useCallback((ids?: string[]) => {
    window.requestAnimationFrame(() => {
      if (ids?.length) {
        reactFlow.fitView({
          nodes: ids.map((id) => ({ id })),
          padding: 0.55,
          duration: 420,
          maxZoom: 1.18,
        });
        return;
      }
      reactFlow.fitView({ padding: 0.16, duration: 420, minZoom: 0.72, maxZoom: 1.12 });
    });
  }, [reactFlow]);

  return (
    <aside
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="hidden max-h-[calc(100dvh-9rem)] w-[18.5rem] rounded-2xl border border-white/10 bg-[oklch(0.115_0.026_265_/_0.84)] p-3 shadow-[0_18px_56px_oklch(0.03_0.02_265_/_0.36),inset_0_1px_0_oklch(1_0_0_/_0.06)] backdrop-blur-2xl xl:flex xl:flex-col"
    >
      <div className="mb-3 rounded-xl border border-white/10 bg-background/24 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg border border-[oklch(0.68_0.13_292_/_0.32)] bg-[oklch(0.68_0.13_292_/_0.1)] text-[oklch(0.82_0.09_292)]">
              <BrainCircuit className="size-4" />
            </span>
            {labels.title}
          </div>
          <span className="rounded-lg border border-white/10 bg-background/38 px-2 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
            {project.steps.length}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-white/12" />
          <span>{locale === 'ar' ? 'نظام العقد' : 'Node system'}</span>
          <span className="h-px flex-1 bg-white/12" />
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {roles.map((role) => {
          const count = project.steps.filter((step) => getStepVisual(step).role === role).length;
          const visual = getRoleVisual(role);
          const Icon = getStepRoleIcon(role);
          return (
            <button
              type="button"
              key={role}
              aria-pressed={activeRole === role}
              onClick={() => {
                const nextRole = activeRole === role ? null : role;
                onRoleChange(nextRole);
                const ids = nextRole
                  ? project.steps.filter((step) => getStepVisual(step).role === nextRole).map((step) => step.id)
                  : undefined;
                focusNodes(ids);
              }}
              className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-start text-[11px] font-bold shadow-[inset_0_1px_0_oklch(1_0_0_/_0.04)] transition hover:brightness-110 ${
                activeRole === role ? 'ring-1 ring-white/28' : ''
              } ${visual.rail}`}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-background/24">
                <Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate">{labels.categories[role]}</span>
              <span className="rounded-md bg-background/28 px-1.5 py-0.5 font-mono text-[10px] opacity-90">{count}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          onRoleChange(null);
          onSelectStep(null);
          focusNodes();
        }}
        className={`mb-2 flex h-11 w-full items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${
          selectedStepId === null
            ? 'border-[oklch(0.68_0.13_292_/_0.42)] bg-[oklch(0.68_0.13_292_/_0.12)] text-white shadow-[0_0_14px_oklch(0.5_0.1_292_/_0.14)]'
            : 'border-white/10 bg-background/24 text-muted-foreground hover:bg-muted/35 hover:text-foreground'
        }`}
      >
        <GitBranch className="size-4 text-[oklch(0.82_0.09_292)]" />
        {labels.graph}
      </button>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
        {project.steps.map((step, index) => {
          const done = step.status === 'done';
          const visual = getStepVisual(step);
          const Icon = getStepRoleIcon(visual.role);
          return (
            <button
              type="button"
              key={step.id}
              onClick={() => {
                onSelectStep(step);
                focusNodes([step.id]);
              }}
              className={`group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-start text-xs transition ${
                selectedStepId === step.id
                  ? 'border-white/18 bg-white/[0.065] text-white shadow-[0_0_18px_oklch(0.58_0.1_255_/_0.12)]'
                  : 'border-white/10 bg-background/18 text-muted-foreground hover:border-white/20 hover:bg-background/28 hover:text-foreground'
              }`}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background/35 shadow-[0_0_9px_currentColor]"
                style={{ color: visual.accent, borderColor: visual.accent }}
              >
                {done ? <CheckCircle2 className="size-4 text-[var(--pg-accent-green)]" /> : <Icon className="size-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{step.title}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                  ID: N-{String(index + 1).padStart(3, '0')} · {done ? labels.done : labels.categories[visual.role]}
                </span>
              </span>
              <CircleDot className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100" style={{ color: visual.accent }} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled
        title={labels.disabled}
        className="mt-3 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-white/14 bg-background/20 text-xs font-semibold text-muted-foreground/55"
      >
        <Plus className="size-4" />
        {labels.custom}
      </button>
    </aside>
  );
}

function buildGraph(
  project: Project,
  locale: 'en' | 'ar',
  doneCount: number,
  percent: number,
  activeRole: StepVisualRole | null,
  layoutCycle: number,
): { nodes: RFNode<GraphNodeData>[]; edges: RFEdge[] } {
  const firstSteps = project.steps.filter((step) => step.dependsOn.length === 0);
  const dependedOn = new Set(project.edges.map((edge) => edge.source));
  const lastSteps = project.steps.filter((step) => !dependedOn.has(step.id));
  const edgeStyle = { stroke: 'oklch(0.76 0.028 265 / 58%)', strokeWidth: 1.9 };
  const edgeMarker = { type: MarkerType.ArrowClosed, color: 'oklch(0.8 0.035 265 / 68%)' };
  const primaryEdgeStyle = {
    stroke: 'oklch(0.82 0.045 265 / 70%)',
    strokeWidth: 2.2,
  };

  const nodes: RFNode<GraphNodeData>[] = [
    {
      id: ROOT_ID,
      type: 'rootNode',
      position: { x: 0, y: 0 },
      data: { name: project.meta.name, idea: project.meta.idea, locale, dimmed: activeRole !== null },
      selectable: false,
    },
    ...project.steps.map((step) => ({
      id: step.id,
      type: 'stepNode',
      position: { x: 0, y: 0 },
      data: { step, locale, dimmed: activeRole !== null && getStepVisual(step).role !== activeRole },
    })),
    {
      id: DELIVERY_ID,
      type: 'deliveryNode',
      position: { x: 0, y: 0 },
      data: { percent, done: doneCount, total: project.steps.length, locale, dimmed: activeRole !== null },
      selectable: false,
    },
  ];

  const edges: RFEdge[] = [
    ...firstSteps.map((step) => ({
      id: `${ROOT_ID}->${step.id}`,
      source: ROOT_ID,
      target: step.id,
      type: 'smoothstep',
      style: activeRole ? { ...primaryEdgeStyle, opacity: 0.34 } : primaryEdgeStyle,
      markerEnd: edgeMarker,
    })),
    ...project.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: edgeStyleForFilter(edge.source, edge.target, project, activeRole, edgeStyle),
      markerEnd: edgeMarker,
    })),
    ...lastSteps.map((step) => ({
      id: `${step.id}->${DELIVERY_ID}`,
      source: step.id,
      target: DELIVERY_ID,
      type: 'smoothstep',
      style: activeRole && getStepVisual(step).role !== activeRole ? { ...edgeStyle, opacity: 0.28 } : edgeStyle,
      markerEnd: edgeMarker,
    })),
  ];

  return layoutVertical(nodes, edges, locale, layoutCycle);
}

function edgeStyleForFilter(
  source: string,
  target: string,
  project: Project,
  activeRole: StepVisualRole | null,
  baseStyle: { stroke: string; strokeWidth: number },
) {
  if (!activeRole) return baseStyle;
  const sourceStep = project.steps.find((step) => step.id === source);
  const targetStep = project.steps.find((step) => step.id === target);
  const highlighted = sourceStep && getStepVisual(sourceStep).role === activeRole
    || targetStep && getStepVisual(targetStep).role === activeRole;
  return {
    ...baseStyle,
    stroke: highlighted ? getRoleVisual(activeRole).accent : baseStyle.stroke,
    strokeWidth: highlighted ? 2.4 : 1.5,
    opacity: highlighted ? 0.78 : 0.22,
  };
}

function layoutVertical(
  nodes: RFNode<GraphNodeData>[],
  edges: RFEdge[],
  locale: 'en' | 'ar',
  layoutCycle: number,
): { nodes: RFNode<GraphNodeData>[]; edges: RFEdge[] } {
  const stepNodes = nodes.filter((node): node is RFNode<StepNodeData> => 'step' in node.data);
  const positions = new Map<string, { x: number; y: number }>();
  const yGap = 54;
  const laneOffset = layoutCycle % 2 === 0 ? 0 : 28;
  const orderedSteps = orderStepsForWorkflow(stepNodes, edges);

  positions.set(ROOT_ID, { x: -SYNTH_WIDTH / 2, y: 0 });

  orderedSteps.forEach((node, index) => {
    positions.set(node.id, {
      x: -STEP_WIDTH / 2 + (index % 2 === 0 ? -laneOffset : laneOffset),
      y: SYNTH_HEIGHT + yGap + index * (STEP_HEIGHT + yGap),
    });
  });

  positions.set(DELIVERY_ID, {
    x: -SYNTH_WIDTH / 2,
    y: SYNTH_HEIGHT + yGap + orderedSteps.length * (STEP_HEIGHT + yGap) + 8,
  });

  const laidOut = nodes.map((node) => {
    const pos = positions.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      position: {
        x: locale === 'ar' ? -pos.x - nodeWidth(node) : pos.x,
        y: pos.y,
      },
    };
  });

  return { nodes: laidOut, edges };
}

function orderStepsForWorkflow(stepNodes: RFNode<StepNodeData>[], edges: RFEdge[]) {
  const byId = new Map(stepNodes.map((node) => [node.id, node]));
  const incomingCount = new Map(stepNodes.map((node) => [node.id, node.data.step.dependsOn.length]));
  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!byId.has(edge.source) || !byId.has(edge.target)) return;
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  });

  const queue = stepNodes
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .sort((a, b) => stepNodes.indexOf(a) - stepNodes.indexOf(b));
  const ordered: RFNode<StepNodeData>[] = [];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    ordered.push(node);

    for (const target of outgoing.get(node.id) ?? []) {
      incomingCount.set(target, Math.max(0, (incomingCount.get(target) ?? 1) - 1));
      if ((incomingCount.get(target) ?? 0) === 0) {
        const targetNode = byId.get(target);
        if (targetNode) queue.push(targetNode);
      }
    }
  }

  for (const node of stepNodes) {
    if (!seen.has(node.id)) ordered.push(node);
  }

  return ordered;
}

function nodeWidth(node: RFNode<GraphNodeData>) {
  return node.id === ROOT_ID || node.id === DELIVERY_ID ? SYNTH_WIDTH : STEP_WIDTH;
}
