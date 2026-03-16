import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeDragHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { groupIdeas } from './api/groups';
import FreeformEdge from './components/FreeformEdge';
import GroupingPanel from './components/GroupingPanel';
import Header from './components/Header';
import MindMapNodeCard from './components/MindMapNodeCard';
import OnboardingModal from './components/OnboardingModal';
import { layoutMindMap } from './lib/layout';
import { createSpreadLayout } from './lib/spreadLayout';
import { useMindMapStore } from './store/useMindMapStore';
import type { GroupableIdea, IdeaGroup, NodeMap } from './types';

const GROUP_COLORS = ['#e97b63', '#2c6ea8', '#3d8f74', '#c98b2c', '#8a67d1'];

const nodeTypes = {
  mindNode: MindMapNodeCard
};

const edgeTypes = {
  freeform: FreeformEdge
};

const isVisible = (nodeId: string, nodes: NodeMap) => {
  let current = nodes[nodeId];

  while (current.parentId) {
    const parent = nodes[current.parentId];
    if (!parent || parent.collapsed) {
      return false;
    }
    current = parent;
  }

  return true;
};

const shouldShowOnboarding = (nodes: NodeMap) => {
  const values = Object.values(nodes);
  return values.length === 1 && values[0]?.text === '생각하고 싶은 아이디어';
};

function AppShell() {
  const exportTargetRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const [viewMode, setViewMode] = useState<'spread' | 'structured' | 'grouped'>('spread');
  const [groups, setGroups] = useState<IdeaGroup[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);
  const {
    nodes,
    setSelectedNodeId,
    initializeMap,
    resetMap,
    updateNodePosition
  } = useMindMapStore();

  const visibleIds = useMemo(
    () => Object.keys(nodes).filter((nodeId) => isVisible(nodeId, nodes)),
    [nodes]
  );

  const groupLookup = useMemo(() => {
    const lookup = new Map<string, { color: string; label: string }>();
    groups.forEach((group, index) => {
      const color = GROUP_COLORS[index % GROUP_COLORS.length];
      group.nodeIds.forEach((nodeId) => lookup.set(nodeId, { color, label: group.label }));
    });
    return lookup;
  }, [groups]);

  const flowEdges = useMemo<Edge[]>(
    () =>
      visibleIds
        .map((nodeId) => nodes[nodeId])
        .filter((node) => node.parentId !== null)
        .map((node) => ({
          id: `${node.parentId}-${node.id}`,
          source: node.parentId!,
          target: node.id,
          type: viewMode === 'structured' ? 'smoothstep' : 'freeform',
          style: {
            stroke: viewMode === 'structured' ? '#9eb1c7' : '#587ea6',
            strokeWidth: viewMode === 'structured' ? 2 : 2.25
          }
        })),
    [nodes, viewMode, visibleIds]
  );

  const flowNodes = useMemo<Node[]>(() => {
    const baseNodes = visibleIds.map((nodeId) => {
      const node = nodes[nodeId];
      const group = groupLookup.get(node.id);

      return {
        id: node.id,
        type: 'mindNode',
        position: { x: 0, y: 0 },
        draggable: viewMode === 'spread',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          text: node.text,
          childCount: node.children.length,
          collapsed: Boolean(node.collapsed),
          isRoot: node.parentId === null,
          groupColor: viewMode === 'grouped' ? group?.color : undefined,
          groupLabel: viewMode === 'grouped' ? group?.label : undefined,
          showHandles: viewMode === 'structured'
        }
      };
    });

    if (viewMode === 'structured') {
      return layoutMindMap(baseNodes, flowEdges);
    }

    return createSpreadLayout(baseNodes, flowEdges, nodes);
  }, [flowEdges, groupLookup, nodes, viewMode, visibleIds]);

  const groupedCards = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        ideas: group.nodeIds
          .map((nodeId) => nodes[nodeId])
          .filter(Boolean)
          .map((node) => ({
            id: node.id,
            text: node.text,
            parentText: node.parentId ? nodes[node.parentId]?.text ?? null : null
          }))
      })),
    [groups, nodes]
  );

  const handleStart = (mainIdea: string, keywords: string[]) => {
    initializeMap(mainIdea, keywords);
    setGroups([]);
    setViewMode('spread');
  };

  useEffect(() => {
    if (viewMode === 'grouped') {
      return;
    }

    const timer = window.setTimeout(() => {
      void fitView({
        padding: 0.2,
        duration: viewMode === 'structured' ? 300 : 0
      });
    }, 30);

    return () => window.clearTimeout(timer);
  }, [fitView, flowNodes, viewMode]);

  const handleExportPng = async () => {
    if (!exportTargetRef.current) {
      return;
    }

    const dataUrl = await toPng(exportTargetRef.current, {
      cacheBust: true,
      backgroundColor: '#f5f7fb',
      pixelRatio: 2
    });

    const link = document.createElement('a');
    link.download = 'mind-map.png';
    link.href = dataUrl;
    link.click();
  };

  const handleGroup = async () => {
    const ideas: GroupableIdea[] = Object.values(nodes)
      .filter((node) => node.parentId !== null)
      .map((node) => ({
        id: node.id,
        text: node.text,
        parentText: node.parentId ? nodes[node.parentId]?.text ?? null : null
      }));

    if (ideas.length < 2) {
      window.alert('묶을 수 있을 만큼 충분한 아이디어가 없습니다.');
      return;
    }

    setIsGrouping(true);

    try {
      const nextGroups = await groupIdeas(ideas);
      setGroups(nextGroups);
      setViewMode('grouped');
    } catch (error) {
      const message = error instanceof Error ? error.message : '묶기 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      setIsGrouping(false);
    }
  };

  const handleNodeDragStop: NodeDragHandler = (_event, node) => {
    if (viewMode !== 'spread') {
      return;
    }

    updateNodePosition(node.id, {
      x: node.position.x + 110,
      y: node.position.y + 53
    });
  };

  return (
    <div className="app-shell">
      <Header
        onReset={() => {
          resetMap();
          setGroups([]);
          setViewMode('spread');
        }}
        onExportPng={handleExportPng}
        viewMode={viewMode}
        onChangeView={setViewMode}
      />

      <div ref={exportTargetRef}>
        {viewMode === 'grouped' ? (
          <GroupingPanel groups={groupedCards} isGrouping={isGrouping} onGroup={handleGroup} />
        ) : (
          <main className="workspace-single">
            <div className="flow-panel">
              <ReactFlow
                key={`${viewMode}-${flowNodes.length}`}
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                nodesDraggable={viewMode === 'spread'}
                elementsSelectable
                minZoom={0.2}
                maxZoom={1.6}
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onNodeDragStop={handleNodeDragStop}
                onPaneClick={() => setSelectedNodeId(null)}
              >
                <Background color="#d8e0ea" gap={28} />
                <MiniMap
                  pannable
                  zoomable
                  style={{ backgroundColor: '#fff', border: '1px solid #dce5f0' }}
                  nodeColor={(node) =>
                    typeof node.data?.groupColor === 'string' ? node.data.groupColor : '#143b63'
                  }
                />
                <Controls />
              </ReactFlow>
            </div>
          </main>
        )}
      </div>

      <OnboardingModal open={shouldShowOnboarding(nodes)} onSubmit={handleStart} />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppShell />
    </ReactFlowProvider>
  );
}
