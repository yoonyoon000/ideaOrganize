import type { Folder, Idea, NodeMap, Project, ProjectEdge } from '../types';

const MINDMAP_STORAGE_KEY = 'mind-map-brainstorm-kr';
const IDEAS_STORAGE_KEY = 'mind-map-idea-studio-ideas';
const FOLDERS_STORAGE_KEY = 'mind-map-idea-studio-folders';
const PROJECTS_STORAGE_KEY = 'mind-map-projects';
const SELECTED_PROJECT_STORAGE_KEY = 'mind-map-selected-project-id';
const CURRENT_USER_ID_STORAGE_KEY = 'mind-map-current-user-id';

const namespacedKey = (baseKey: string, userId?: string | null) =>
  userId ? `${baseKey}:${userId}` : baseKey;

export const saveMindMap = (nodes: NodeMap) => {
  localStorage.setItem(MINDMAP_STORAGE_KEY, JSON.stringify(nodes));
};

export const loadMindMap = (): NodeMap | null => {
  const raw = localStorage.getItem(MINDMAP_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as NodeMap;
  } catch {
    return null;
  }
};

export const saveIdeas = (ideas: Idea[]) => {
  localStorage.setItem(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
};

export const loadIdeas = (): Idea[] => {
  const raw = localStorage.getItem(IDEAS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Idea[];
  } catch {
    return [];
  }
};

export const saveFolders = (folders: Folder[]) => {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
};

export const loadFolders = (): Folder[] => {
  const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Folder[];
  } catch {
    return [];
  }
};

export const saveProjects = (projects: Project[], userId?: string | null) => {
  localStorage.setItem(namespacedKey(PROJECTS_STORAGE_KEY, userId), JSON.stringify(projects));
};

export const loadProjects = (userId?: string | null): Project[] => {
  const raw = localStorage.getItem(namespacedKey(PROJECTS_STORAGE_KEY, userId));
  if (raw) {
    try {
      return JSON.parse(raw) as Project[];
    } catch {
      return [];
    }
  }

  if (userId) {
    return [];
  }

  const legacyNodes = loadMindMap();
  const legacyIdeas = loadIdeas();
  const legacyFolders = loadFolders();

  if (!legacyNodes && legacyIdeas.length === 0 && legacyFolders.length === 0) {
    return [];
  }

  const now = Date.now();
  const nodes = legacyNodes ?? {};
  const rootNode = Object.values(nodes).find((node) => node.parentId === null);

  return [
    {
      id: `legacy-${now}`,
      title:
        rootNode && rootNode.text !== '생각하고 싶은 아이디어'
          ? rootNode.text
          : '기존 프로젝트',
      createdAt: now,
      updatedAt: now,
      mindMapData: {
        nodes,
        edges: buildProjectEdges(nodes)
      },
      ideas: legacyIdeas,
      folders: legacyFolders
    }
  ];
};

export const saveSelectedProjectId = (projectId: string | null, userId?: string | null) => {
  if (!projectId) {
    localStorage.removeItem(namespacedKey(SELECTED_PROJECT_STORAGE_KEY, userId));
    return;
  }

  localStorage.setItem(namespacedKey(SELECTED_PROJECT_STORAGE_KEY, userId), projectId);
};

export const loadSelectedProjectId = (userId?: string | null): string | null =>
  localStorage.getItem(namespacedKey(SELECTED_PROJECT_STORAGE_KEY, userId));

export const saveCurrentUserId = (userId: string | null) => {
  if (!userId) {
    localStorage.removeItem(CURRENT_USER_ID_STORAGE_KEY);
    return;
  }

  localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, userId);
};

export const loadCurrentUserId = (): string | null =>
  localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY);

export const clearLegacyStandaloneStorage = () => {
  localStorage.removeItem(MINDMAP_STORAGE_KEY);
  localStorage.removeItem(IDEAS_STORAGE_KEY);
  localStorage.removeItem(FOLDERS_STORAGE_KEY);
};

export const buildProjectEdges = (nodes: NodeMap): ProjectEdge[] =>
  Object.values(nodes)
    .filter((node) => node.parentId !== null)
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId!,
      target: node.id
    }));
