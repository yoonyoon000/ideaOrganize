import type { NodeMap } from '../types';

const STORAGE_KEY = 'mind-map-brainstorm-kr';

export const saveMindMap = (nodes: NodeMap) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
};

export const loadMindMap = (): NodeMap | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as NodeMap;
  } catch {
    return null;
  }
};
