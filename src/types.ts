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
