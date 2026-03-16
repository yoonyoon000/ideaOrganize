import { memo, useEffect, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { useProjectStore } from '../store/useProjectStore';

type MindMapCardData = {
  text: string;
  childCount: number;
  isRoot: boolean;
  groupColor?: string;
  groupLabel?: string;
  showHandles: boolean;
  isHighlighted?: boolean;
};

function MindMapNodeCard({ id, data, selected }: NodeProps) {
  const nodeData = data as MindMapCardData;
  const {
    updateNodeText,
    addChildNode,
    deleteNode,
    setSelectedNodeId,
    editingNodeId,
    setEditingNodeId
  } = useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(data.text ?? ''));

  useEffect(() => {
    setDraft(String(nodeData.text ?? ''));
  }, [nodeData.text]);

  useEffect(() => {
    setIsEditing(editingNodeId === id);
  }, [editingNodeId, id]);

  const save = () => {
    const nextText = draft.trim();
    if (nextText) {
      updateNodeText(id, nextText);
    } else {
      setDraft(String(data.text ?? ''));
      setEditingNodeId(null);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`mind-node ${selected ? 'mind-node-selected' : ''} ${nodeData.isHighlighted ? 'mind-node-highlighted' : ''} ${nodeData.showHandles ? '' : 'mind-node-freeform'}`}
      style={{ borderColor: typeof nodeData.groupColor === 'string' ? nodeData.groupColor : undefined }}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`mind-handle ${nodeData.showHandles ? '' : 'mind-handle-hidden'}`}
      />

      <div className="mind-node-head">
        <div className="mind-node-title-row">
          {isEditing ? (
            <textarea
              className="mind-node-editor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={save}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  save();
                }
              }}
              autoFocus
              rows={2}
            />
          ) : (
            <>
              <p className="mind-node-text">{String(nodeData.text ?? '')}</p>
              <button
                type="button"
                className="icon-button"
                aria-label="아이디어 수정"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingNodeId(id);
                }}
              >
                ✎
              </button>
            </>
          )}
        </div>
        <div className="mind-node-meta-row">
          <span className="mind-node-badge">하위 {Number(nodeData.childCount ?? 0)}개</span>
          <button
            type="button"
            className="icon-button"
            aria-label="하위 아이디어 추가"
            onClick={(event) => {
              event.stopPropagation();
              addChildNode(id);
            }}
          >
            ＋
          </button>
        </div>
      </div>

      {typeof nodeData.groupLabel === 'string' && (
        <div className="mind-node-group" style={{ color: String(nodeData.groupColor ?? '#2c6ea8') }}>
          묶음: {nodeData.groupLabel}
        </div>
      )}

      {selected && (
        <div className="mind-node-panel">
          <button
            type="button"
            className="secondary-button mind-node-idea-button"
            onClick={(event) => {
              event.stopPropagation();
              window.dispatchEvent(
                new CustomEvent('mindmap:create-idea', {
                  detail: { nodeId: id, title: nodeData.text }
                })
              );
            }}
          >
            아이디어 구체화하기
          </button>
          <button
            type="button"
            className="delete-button"
            onClick={(event) => {
              event.stopPropagation();
              deleteNode(id);
            }}
            disabled={Boolean(nodeData.isRoot)}
          >
            삭제
          </button>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={`mind-handle ${nodeData.showHandles ? '' : 'mind-handle-hidden'}`}
      />
    </div>
  );
}

export default memo(MindMapNodeCard);
