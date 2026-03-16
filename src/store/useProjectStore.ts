import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  buildProjectEdges,
  loadProjects,
  loadSelectedProjectId,
  saveProjects,
  saveSelectedProjectId
} from '../lib/storage';
import type { Folder, Idea, NodeMap, NodePosition, Project } from '../types';

type ProjectStore = {
  projects: Project[];
  selectedProjectId: string | null;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  createProject: (title?: string) => string;
  selectProject: (id: string) => void;
  updateProjectTitle: (id: string, title: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  initializeMap: (mainIdea: string, keywords: string[]) => void;
  addChildNode: (parentId: string, text?: string) => string;
  updateNodeText: (id: string, text: string) => void;
  updateNodePosition: (id: string, position: NodePosition) => void;
  deleteNode: (id: string) => void;
  toggleCollapsed: (id: string) => void;
  createIdea: (input?: Partial<Pick<Idea, 'title' | 'sourceNodeId' | 'folderId'>>) => string;
  updateIdea: (id: string, patch: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  toggleBookmark: (id: string) => void;
  createFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
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

const createProjectRecord = (title = '새 프로젝트'): Project => {
  const nodes = createInitialMap();
  const now = Date.now();

  return {
    id: nanoid(),
    title,
    createdAt: now,
    updatedAt: now,
    mindMapData: {
      nodes,
      edges: buildProjectEdges(nodes)
    },
    ideas: [],
    folders: []
  };
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

const persist = (projects: Project[], selectedProjectId: string | null) => {
  saveProjects(projects);
  saveSelectedProjectId(selectedProjectId);
};

const getProjectIndex = (projects: Project[], selectedProjectId: string | null) =>
  projects.findIndex((project) => project.id === selectedProjectId);

const getDefaultSelectedNodeId = (project: Project | undefined) =>
  project ? Object.keys(project.mindMapData.nodes)[0] ?? null : null;

export const useProjectStore = create<ProjectStore>((set, get) => {
  const projects = loadProjects();
  const storedSelectedId = loadSelectedProjectId();
  const selectedProjectId =
    storedSelectedId && projects.some((project) => project.id === storedSelectedId)
      ? storedSelectedId
      : projects[0]?.id ?? null;

  if (projects.length > 0) {
    persist(projects, selectedProjectId);
  }

  return {
    projects,
    selectedProjectId,
    selectedNodeId: getDefaultSelectedNodeId(projects.find((project) => project.id === selectedProjectId)),
    editingNodeId: null,
    createProject: (title) => {
      const project = createProjectRecord(title?.trim() || '새 프로젝트');

      set((state) => {
        const nextProjects = [project, ...state.projects];
        persist(nextProjects, project.id);

        return {
          projects: nextProjects,
          selectedProjectId: project.id,
          selectedNodeId: getDefaultSelectedNodeId(project),
          editingNodeId: null
        };
      });

      return project.id;
    },
    selectProject: (id) => {
      set((state) => {
        const project = state.projects.find((item) => item.id === id);
        if (!project) {
          return state;
        }

        persist(state.projects, id);

        return {
          selectedProjectId: id,
          selectedNodeId: getDefaultSelectedNodeId(project),
          editingNodeId: null
        };
      });
    },
    updateProjectTitle: (id, title) => {
      const trimmed = title.trim();
      if (!trimmed) {
        return;
      }

      set((state) => {
        const nextProjects = state.projects.map((project) =>
          project.id === id
            ? {
                ...project,
                title: trimmed,
                updatedAt: Date.now()
              }
            : project
        );

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setEditingNodeId: (id) => set({ editingNodeId: id }),
    initializeMap: (mainIdea, keywords) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

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

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...nextProjects[projectIndex],
          updatedAt: Date.now(),
          title:
            nextProjects[projectIndex].title === '새 프로젝트'
              ? mainIdea
              : nextProjects[projectIndex].title,
          mindMapData: {
            nodes: nextNodes,
            edges: buildProjectEdges(nextNodes)
          }
        };

        persist(nextProjects, state.selectedProjectId);

        return {
          projects: nextProjects,
          selectedNodeId: rootId,
          editingNodeId: null
        };
      });
    },
    addChildNode: (parentId, text = '새 아이디어') => {
      const childId = nanoid();

      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const nodes = project.mindMapData.nodes;
        const parent = nodes[parentId];
        if (!parent) {
          return state;
        }

        const siblingIndex = parent.children.length;
        const angle = siblingIndex * 0.7 - 1.4;
        const parentPosition = parent.position ?? { x: 0, y: 0 };
        const nextNodes = {
          ...nodes,
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
        };

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          mindMapData: {
            nodes: nextNodes,
            edges: buildProjectEdges(nextNodes)
          }
        };

        persist(nextProjects, state.selectedProjectId);

        return {
          projects: nextProjects,
          selectedNodeId: childId,
          editingNodeId: childId
        };
      });

      return childId;
    },
    updateNodeText: (id, text) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const node = project.mindMapData.nodes[id];
        if (!node) {
          return state;
        }

        const nextNodes = {
          ...project.mindMapData.nodes,
          [id]: {
            ...node,
            text
          }
        };

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          mindMapData: {
            nodes: nextNodes,
            edges: buildProjectEdges(nextNodes)
          }
        };

        persist(nextProjects, state.selectedProjectId);

        return {
          projects: nextProjects,
          editingNodeId: state.editingNodeId === id ? null : state.editingNodeId
        };
      });
    },
    updateNodePosition: (id, position) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const node = project.mindMapData.nodes[id];
        if (!node) {
          return state;
        }

        const nextNodes = {
          ...project.mindMapData.nodes,
          [id]: {
            ...node,
            position
          }
        };

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          mindMapData: {
            nodes: nextNodes,
            edges: buildProjectEdges(nextNodes)
          }
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    deleteNode: (id) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const target = project.mindMapData.nodes[id];
        if (!target || target.parentId === null) {
          return state;
        }

        const parent = project.mindMapData.nodes[target.parentId];
        const prunedNodes = deleteRecursively(project.mindMapData.nodes, id);
        const nextNodes = {
          ...prunedNodes,
          [parent.id]: {
            ...parent,
            children: parent.children.filter((childId) => childId !== id)
          }
        };

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          mindMapData: {
            nodes: nextNodes,
            edges: buildProjectEdges(nextNodes)
          }
        };

        persist(nextProjects, state.selectedProjectId);

        return {
          projects: nextProjects,
          selectedNodeId: parent.id,
          editingNodeId: state.editingNodeId === id ? null : state.editingNodeId
        };
      });
    },
    toggleCollapsed: (id) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const node = project.mindMapData.nodes[id];
        if (!node) {
          return state;
        }

        const nextNodes = {
          ...project.mindMapData.nodes,
          [id]: {
            ...node,
            collapsed: !node.collapsed
          }
        };

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          mindMapData: {
            nodes: nextNodes,
            edges: buildProjectEdges(nextNodes)
          }
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    createIdea: (input) => {
      const ideaId = nanoid();
      const now = Date.now();

      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const idea: Idea = {
          id: ideaId,
          title: input?.title?.trim() || '새 아이디어',
          description: '',
          tags: [],
          bookmarked: false,
          folderId: input?.folderId,
          sourceNodeId: input?.sourceNodeId,
          createdAt: now,
          updatedAt: now,
          referenceLinks: [],
          referenceImages: [],
          sketchImages: []
        };

        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: now,
          ideas: [idea, ...project.ideas]
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });

      return ideaId;
    },
    updateIdea: (id, patch) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          ideas: project.ideas.map((idea) =>
            idea.id === id
              ? {
                  ...idea,
                  ...patch,
                  updatedAt: Date.now()
                }
              : idea
          )
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    deleteIdea: (id) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          ideas: project.ideas.filter((idea) => idea.id !== id)
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    toggleBookmark: (id) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          ideas: project.ideas.map((idea) =>
            idea.id === id
              ? {
                  ...idea,
                  bookmarked: !idea.bookmarked,
                  updatedAt: Date.now()
                }
              : idea
          )
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    createFolder: (name) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: Date.now(),
          folders: [
            ...project.folders,
            {
              id: nanoid(),
              name: trimmed
            }
          ]
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    },
    deleteFolder: (id) => {
      set((state) => {
        const projectIndex = getProjectIndex(state.projects, state.selectedProjectId);
        if (projectIndex < 0) {
          return state;
        }

        const project = state.projects[projectIndex];
        const now = Date.now();
        const nextProjects = [...state.projects];
        nextProjects[projectIndex] = {
          ...project,
          updatedAt: now,
          folders: project.folders.filter((folder) => folder.id !== id),
          ideas: project.ideas.map((idea) =>
            idea.folderId === id
              ? {
                  ...idea,
                  folderId: undefined,
                  updatedAt: now
                }
              : idea
          )
        };

        persist(nextProjects, state.selectedProjectId);
        return { projects: nextProjects };
      });
    }
  };
});
