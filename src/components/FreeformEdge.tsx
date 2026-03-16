import {
  BaseEdge,
  getSmoothStepPath,
  useStore,
  type EdgeProps,
  type InternalNode,
  type Position
} from '@xyflow/react';

const getNodeMetrics = (node: InternalNode) => {
  const width = node.measured?.width ?? 220;
  const height = node.measured?.height ?? 106;
  const x = node.internals.positionAbsolute.x;
  const y = node.internals.positionAbsolute.y;

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2
  };
};

const getHorizontalBoundary = (from: InternalNode, to: InternalNode) => {
  const source = getNodeMetrics(from);
  const target = getNodeMetrics(to);
  const goesRight = target.centerX >= source.centerX;

  return {
    x: goesRight ? source.x + source.width : source.x,
    y: source.centerY,
    position: (goesRight ? 'right' : 'left') as Position
  };
};

export default function FreeformEdge({
  id,
  source,
  target,
  style
}: EdgeProps) {
  const sourceNode = useStore((store) => store.nodeLookup.get(source));
  const targetNode = useStore((store) => store.nodeLookup.get(target));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourcePoint = getHorizontalBoundary(sourceNode, targetNode);
  const targetPoint = getHorizontalBoundary(targetNode, sourceNode);

  const [path] = getSmoothStepPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    sourcePosition: sourcePoint.position,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    targetPosition: targetPoint.position,
    borderRadius: 24,
    offset: 24
  });

  return <BaseEdge id={id} path={path} style={style} />;
}
