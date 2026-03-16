export type NodePosition = {
  x: number;
  y: number;
};

export type MindMapNode = {
  id: string;
  text: string;
  parentId: string | null;
  children: string[];
  collapsed?: boolean;
  position?: NodePosition;
};

export type NodeMap = Record<string, MindMapNode>;

export type GroupableIdea = {
  id: string;
  text: string;
  parentText: string | null;
};

export type IdeaGroup = {
  id: string;
  label: string;
  nodeIds: string[];
  reason: string;
};

export type AiActionType = 'expand' | 'opposite' | 'extreme' | 'combine';

export type BrainstormPromptInput = {
  currentNodeTitle: string;
  parentNodeTitle?: string;
  siblingNodeTitles: string[];
  childNodeTitles: string[];
  actionType: AiActionType;
  userGoal: '브레인스토밍 확장';
  language: 'ko';
};

export type AiSuggestionResponse = {
  analysis: string;
  suggestion: string;
  nextNodeCandidates: string[];
};

export type AiSuggestion = AiSuggestionResponse & {
  action: AiActionType;
  title: string;
  content: string;
};

export type Folder = {
  id: string;
  name: string;
};

export type Idea = {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  bookmarked: boolean;
  folderId?: string;
  sourceNodeId?: string;
  createdAt: number;
  updatedAt: number;
  referenceLinks: string[];
  referenceImages: string[];
  sketchImages: string[];
};

export type ProjectEdge = {
  id: string;
  source: string;
  target: string;
};

export type ProjectMindMapData = {
  nodes: NodeMap;
  edges: ProjectEdge[];
};

export type Project = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mindMapData: ProjectMindMapData;
  ideas: Idea[];
  folders: Folder[];
};
