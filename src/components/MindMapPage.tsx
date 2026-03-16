import { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  type Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { groupIdeas } from '../api/groups';
import { createSpreadLayout } from '../lib/spreadLayout';
import { layoutMindMap } from '../lib/layout';
import { useProjectStore } from '../store/useProjectStore';
import type { GroupableIdea, IdeaGroup, NodeMap, Project } from '../types';
import FreeformEdge from './FreeformEdge';
import GroupingPanel from './GroupingPanel';
import Header from './Header';
import IdeaDetail from './IdeaDetail';
import IdeaStudio from './IdeaStudio';
import MindMapNodeCard from './MindMapNodeCard';
import OnboardingModal from './OnboardingModal';

const GROUP_COLORS = ['#e97b63', '#2c6ea8', '#3d8f74', '#c98b2c', '#8a67d1'];

const nodeTypes = {
  mindNode: MindMapNodeCard
};

const edgeTypes = {
  freeform: FreeformEdge
};

type MindMapPageProps = {
  project: Project;
  onGoHome: () => void;
};

type HighlightState = {
  highlightedNodeIds: string[];
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

function MindMapWorkspace({ project, onGoHome }: MindMapPageProps) {
  const { fitView } = useReactFlow();
  const [workspaceMode, setWorkspaceMode] = useState<'mindmap' | 'studio' | 'detail'>('mindmap');
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [returnToIdeaId, setReturnToIdeaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'spread' | 'structured' | 'grouped'>('spread');
  const [groups, setGroups] = useState<IdeaGroup[]>([]);
  const [isGrouping, setIsGrouping] = useState(false);
  const [highlightState, setHighlightState] = useState<HighlightState>({
    highlightedNodeIds: []
  });
  const {
    selectedNodeId,
    setSelectedNodeId,
    initializeMap,
    updateNodePosition,
    createIdea,
    deleteIdea,
    updateIdea,
    toggleBookmark,
    createFolder,
    updateProjectTitle
  } = useProjectStore();

  const nodes = project.mindMapData.nodes;
  const ideas = project.ideas;
  const folders = project.folders;

  const visibleIds = useMemo(
    () => Object.keys(nodes).filter((nodeId) => isVisible(nodeId, nodes)),
    [nodes]
  );
  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) ?? null,
    [ideas, selectedIdeaId]
  );
  const groupLookup = useMemo(() => {
    const lookup = new Map<string, { color: string; label: string }>();
    groups.forEach((group, index) => {
      const color = GROUP_COLORS[index % GROUP_COLORS.length];
      group.nodeIds.forEach((nodeId) => lookup.set(nodeId, { color, label: group.label }));
    });
    return lookup;
  }, [groups]);
  const highlightedLookup = useMemo(
    () => new Set(highlightState.highlightedNodeIds),
    [highlightState.highlightedNodeIds]
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      visibleIds
        .map((nodeId) => nodes[nodeId])
        .filter((node) => node.parentId !== null)
        .map((node) => {
          const isHighlighted =
            highlightedLookup.has(node.id) &&
            node.parentId !== null &&
            highlightedLookup.has(node.parentId);

          return {
            id: `${node.parentId}-${node.id}`,
            source: node.parentId!,
            target: node.id,
            type: viewMode === 'structured' ? 'smoothstep' : 'freeform',
            style: {
              stroke: isHighlighted ? '#e97b63' : viewMode === 'structured' ? '#9eb1c7' : '#587ea6',
              strokeWidth: isHighlighted ? 3.2 : viewMode === 'structured' ? 2 : 2.25
            }
          };
        }),
    [highlightedLookup, nodes, viewMode, visibleIds]
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
        sourcePosition: 'right' as Position,
        targetPosition: 'left' as Position,
        data: {
          text: node.text,
          childCount: node.children.length,
          isRoot: node.parentId === null,
          groupColor: viewMode === 'grouped' ? group?.color : undefined,
          groupLabel: viewMode === 'grouped' ? group?.label : undefined,
          showHandles: viewMode === 'structured',
          isHighlighted: highlightedLookup.has(node.id)
        }
      };
    });

    if (viewMode === 'structured') {
      return layoutMindMap(baseNodes, flowEdges);
    }

    return createSpreadLayout(baseNodes, flowEdges, nodes);
  }, [flowEdges, groupLookup, highlightedLookup, nodes, viewMode, visibleIds]);

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

  useEffect(() => {
    setWorkspaceMode('mindmap');
    setSelectedIdeaId(null);
    setReturnToIdeaId(null);
    setGroups([]);
    setViewMode('spread');
    setHighlightState({ highlightedNodeIds: [] });
  }, [project.id]);

  const handleStart = (mainIdea: string, keywords: string[]) => {
    initializeMap(mainIdea, keywords);
    setGroups([]);
    setHighlightState({ highlightedNodeIds: [] });
    setViewMode('spread');
    setWorkspaceMode('mindmap');
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

  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string; title: string }>;
      const node = nodes[customEvent.detail.nodeId];

      if (!node) {
        return;
      }

      const ideaId = createIdea({
        title: node.text,
        sourceNodeId: node.id
      });

      setSelectedIdeaId(ideaId);
      setReturnToIdeaId(null);
      setWorkspaceMode('detail');
    };

    window.addEventListener('mindmap:create-idea', listener);
    return () => window.removeEventListener('mindmap:create-idea', listener);
  }, [createIdea, nodes]);

  useEffect(() => {
    if (highlightState.highlightedNodeIds.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHighlightState({ highlightedNodeIds: [] });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [highlightState.highlightedNodeIds]);

  const handleGroup = async () => {
    const ideasToGroup: GroupableIdea[] = Object.values(nodes)
      .filter((node) => node.parentId !== null)
      .map((node) => ({
        id: node.id,
        text: node.text,
        parentText: node.parentId ? nodes[node.parentId]?.text ?? null : null
      }));

    if (ideasToGroup.length < 2) {
      window.alert('묶을 수 있을 만큼 충분한 아이디어가 없습니다.');
      return;
    }

    setIsGrouping(true);

    try {
      const nextGroups = await groupIdeas(ideasToGroup);
      setGroups(nextGroups);
      setViewMode('grouped');
    } catch (error) {
      const message = error instanceof Error ? error.message : '묶기 중 오류가 발생했습니다.';
      window.alert(message);
    } finally {
      setIsGrouping(false);
    }
  };

  const handleNodeDragStop = (_event: unknown, node: Node) => {
    if (viewMode !== 'spread') {
      return;
    }

    updateNodePosition(node.id, {
      x: node.position.x + 110,
      y: node.position.y + 53
    });
  };

  const getAncestorPath = (nodeId: string) => {
    const path: string[] = [];
    let current: NodeMap[string] | undefined = nodes[nodeId];

    while (current) {
      path.push(current.id);
      current = current.parentId ? nodes[current.parentId] : undefined;
    }

    return path;
  };

  const handleCreateIdea = (input?: { title?: string; sourceNodeId?: string; folderId?: string }) => {
    const ideaId = createIdea(input);
    setSelectedIdeaId(ideaId);
    setReturnToIdeaId(null);
    setWorkspaceMode('detail');
  };

  return (
    <div className="app-shell">
      <Header
        projectTitle={project.title}
        onChangeProjectTitle={(title) => updateProjectTitle(project.id, title)}
        onGoHome={onGoHome}
        workspaceMode={workspaceMode}
        onOpenMindMap={() => setWorkspaceMode('mindmap')}
        onOpenStudio={() => {
          setWorkspaceMode('studio');
          setReturnToIdeaId(null);
          if (!selectedIdeaId && ideas[0]) {
            setSelectedIdeaId(ideas[0].id);
          }
        }}
        viewMode={viewMode}
        onChangeView={setViewMode}
      />

      {workspaceMode === 'studio' ? (
        <IdeaStudio
          ideas={ideas}
          folders={folders}
          onCreateIdea={() => handleCreateIdea()}
          onOpenIdea={(ideaId) => {
            setSelectedIdeaId(ideaId);
            setWorkspaceMode('detail');
          }}
          onToggleBookmark={toggleBookmark}
          onCreateFolder={createFolder}
        />
      ) : workspaceMode === 'detail' && selectedIdea ? (
        <IdeaDetail
          idea={selectedIdea}
          folders={folders}
          nodes={nodes}
          onBack={() => setWorkspaceMode('studio')}
          onDelete={(ideaId) => {
            deleteIdea(ideaId);
            setSelectedIdeaId(null);
            setReturnToIdeaId(null);
            setWorkspaceMode('studio');
          }}
          onUpdateIdea={updateIdea}
          onLocateSourceNode={(sourceNodeId) => {
            setSelectedNodeId(sourceNodeId);
            setHighlightState({ highlightedNodeIds: getAncestorPath(sourceNodeId) });
            setReturnToIdeaId(selectedIdea.id);
            setWorkspaceMode('mindmap');
            setViewMode('spread');
          }}
        />
      ) : viewMode === 'grouped' ? (
        <GroupingPanel groups={groupedCards} isGrouping={isGrouping} onGroup={handleGroup} />
      ) : (
        <main className="workspace-single">
          {returnToIdeaId && (
            <button
              type="button"
              className="secondary-button mindmap-return-button"
              onClick={() => {
                setSelectedIdeaId(returnToIdeaId);
                setReturnToIdeaId(null);
                setWorkspaceMode('detail');
              }}
            >
              ← 아이디어로 돌아가기
            </button>
          )}
          <div className="flow-panel">
            <ReactFlow
              key={`${project.id}-${viewMode}-${flowNodes.length}-${highlightState.highlightedNodeIds.join('-') || 'none'}`}
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
              onPaneClick={() => {
                setSelectedNodeId(null);
                setHighlightState({ highlightedNodeIds: [] });
              }}
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

      <OnboardingModal open={shouldShowOnboarding(nodes)} onSubmit={handleStart} />
    </div>
  );
}

export default function MindMapPage(props: MindMapPageProps) {
  return (
    <ReactFlowProvider>
      <MindMapWorkspace {...props} />
    </ReactFlowProvider>
  );
}
