import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { loadMindMap, saveMindMap } from '../lib/storage';
import type { NodeMap, NodePosition } from '../types';

type MindMapStore = {
  nodes: NodeMap;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  initializeMap: (mainIdea: string, keywords: string[]) => void;
  addChildNode: (parentId: string, text?: string) => string;
  updateNodeText: (id: string, text: string) => void;
  updateNodePosition: (id: string, position: NodePosition) => void;
  deleteNode: (id: string) => void;
  toggleCollapsed: (id: string) => void;
  resetMap: () => void;
};

const createInitialMap = (): NodeMap => {
  const rootId = nanoid();
  return {
    [rootId]: {
      id: rootId,
      text: '생각하고 싶은 아이디어',
      parentId: null,
      children: [],
      collapsed: false,
      position: { x: 0, y: 0 }
    }
  };
};

const persist = (nodes: NodeMap) => {
  saveMindMap(nodes);
  return nodes;
};

const deleteRecursively = (nodes: NodeMap, id: string): NodeMap => {
  const nextNodes = { ...nodes };
  const target = nextNodes[id];

  if (!target) {
    return nextNodes;
  }

  target.children.forEach((childId) => {
    const reduced = deleteRecursively(nextNodes, childId);
    Object.keys(nextNodes).forEach((key) => {
      if (!(key in reduced)) {
        delete nextNodes[key];
      }
    });
  });

  delete nextNodes[id];
  return nextNodes;
};

export const useMindMapStore = create<MindMapStore>((set) => {
  const stored = loadMindMap();
  const initialNodes = stored && Object.keys(stored).length > 0 ? stored : createInitialMap();

  return {
    nodes: initialNodes,
    selectedNodeId: Object.keys(initialNodes)[0] ?? null,
    editingNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setEditingNodeId: (id) => set({ editingNodeId: id }),
    initializeMap: (mainIdea, keywords) => {
      const rootId = nanoid();
      const childIds = keywords.map(() => nanoid());
      const nextNodes: NodeMap = {
        [rootId]: {
          id: rootId,
          text: mainIdea,
          parentId: null,
          children: childIds,
          collapsed: false,
          position: { x: 0, y: 0 }
        }
      };

      childIds.forEach((childId, index) => {
        const angle = (Math.PI * 2 * index) / childIds.length - Math.PI / 2;
        nextNodes[childId] = {
          id: childId,
          text: keywords[index],
          parentId: rootId,
          children: [],
          collapsed: false,
          position: {
            x: Math.cos(angle) * 220,
            y: Math.sin(angle) * 220
          }
        };
      });

      persist(nextNodes);
      set({
        nodes: nextNodes,
        selectedNodeId: rootId,
        editingNodeId: null
      });
    },
    addChildNode: (parentId, text = '새 아이디어') => {
      const childId = nanoid();

      set((state) => {
        const parent = state.nodes[parentId];
        if (!parent) {
          return state;
        }

        const siblingIndex = parent.children.length;
        const angle = siblingIndex * 0.7 - 1.4;
        const parentPosition = parent.position ?? { x: 0, y: 0 };

        const nextNodes = persist({
          ...state.nodes,
          [parentId]: {
            ...parent,
            collapsed: false,
            children: [...parent.children, childId]
          },
          [childId]: {
            id: childId,
            text,
            parentId,
            children: [],
            collapsed: false,
            position: {
              x: parentPosition.x + Math.cos(angle) * 220,
              y: parentPosition.y + Math.sin(angle) * 180
            }
          }
        });

        return {
          nodes: nextNodes,
          selectedNodeId: childId,
          editingNodeId: childId
        };
      });

      return childId;
    },
    updateNodeText: (id, text) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) {
          return state;
        }

        return {
          nodes: persist({
            ...state.nodes,
            [id]: {
              ...node,
              text
            }
          }),
          editingNodeId: state.editingNodeId === id ? null : state.editingNodeId
        };
      });
    },
    updateNodePosition: (id, position) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) {
          return state;
        }

        return {
          nodes: persist({
            ...state.nodes,
            [id]: {
              ...node,
              position
            }
          })
        };
      });
    },
    deleteNode: (id) => {
      set((state) => {
        const target = state.nodes[id];
        if (!target || target.parentId === null) {
          return state;
        }

        const parent = state.nodes[target.parentId];
        const prunedNodes = deleteRecursively(state.nodes, id);

        const nextNodes = persist({
          ...prunedNodes,
          [parent.id]: {
            ...parent,
            children: parent.children.filter((childId) => childId !== id)
          }
        });

        return {
          nodes: nextNodes,
          selectedNodeId: parent.id,
          editingNodeId: state.editingNodeId === id ? null : state.editingNodeId
        };
      });
    },
    toggleCollapsed: (id) => {
      set((state) => {
        const node = state.nodes[id];
        if (!node) {
          return state;
        }

        return {
          nodes: persist({
            ...state.nodes,
            [id]: {
              ...node,
              collapsed: !node.collapsed
            }
          })
        };
      });
    },
    resetMap: () => {
      const nextNodes = persist(createInitialMap());
      set({
        nodes: nextNodes,
        selectedNodeId: Object.keys(nextNodes)[0] ?? null,
        editingNodeId: null
      });
    }
  };
});
