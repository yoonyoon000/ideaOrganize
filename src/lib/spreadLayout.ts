import type { Edge, Node } from '@xyflow/react';
import type { NodeMap } from '../types';

const NODE_WIDTH_OFFSET = 110;
const NODE_HEIGHT_OFFSET = 53;

export const createSpreadLayout = (nodes: Node[], edges: Edge[], sourceNodes: NodeMap) => {
  if (nodes.length === 0) {
    return nodes;
  }

  const childrenByParent = edges.reduce<Record<string, string[]>>((acc, edge) => {
    acc[edge.source] = [...(acc[edge.source] ?? []), edge.target];
    return acc;
  }, {});

  const targets = new Set(edges.map((edge) => edge.target));
  const rootId = nodes.find((node) => !targets.has(node.id))?.id ?? nodes[0].id;
  const positions = new Map<string, { x: number; y: number }>();

  const placeNode = (nodeId: string, startAngle: number, endAngle: number, depth: number) => {
    const saved = sourceNodes[nodeId]?.position;

    if (saved) {
      positions.set(nodeId, saved);
    } else if (depth === 0) {
      positions.set(nodeId, { x: 0, y: 0 });
    } else {
      const angle = (startAngle + endAngle) / 2;
      const radius = 220 + depth * 130;
      positions.set(nodeId, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }

    const children = childrenByParent[nodeId] ?? [];
    if (children.length === 0) {
      return;
    }

    const span = endAngle - startAngle;
    const segment = span / children.length;

    children.forEach((childId, index) => {
      const nextStart = startAngle + segment * index;
      placeNode(childId, nextStart, nextStart + segment, depth + 1);
    });
  };

  placeNode(rootId, -Math.PI, Math.PI, 0);

  return nodes.map((node) => {
    const position = positions.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH_OFFSET,
        y: position.y - NODE_HEIGHT_OFFSET
      }
    };
  });
};
