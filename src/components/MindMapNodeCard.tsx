import { memo, useEffect, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { useMindMapStore } from '../store/useMindMapStore';

type MindMapCardData = {
  text: string;
  childCount: number;
  collapsed: boolean;
  isRoot: boolean;
  groupColor?: string;
  groupLabel?: string;
  showHandles: boolean;
};

function MindMapNodeCard({ id, data, selected }: NodeProps) {
  const {
    updateNodeText,
    addChildNode,
    deleteNode,
    toggleCollapsed,
    setSelectedNodeId,
    editingNodeId,
    setEditingNodeId
  } = useMindMapStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(data.text ?? ''));

  useEffect(() => {
    setDraft(String(data.text ?? ''));
  }, [data.text]);

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
      className={`mind-node ${selected ? 'mind-node-selected' : ''} ${data.showHandles ? '' : 'mind-node-freeform'}`}
      style={{ borderColor: typeof data.groupColor === 'string' ? data.groupColor : undefined }}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`mind-handle ${data.showHandles ? '' : 'mind-handle-hidden'}`}
      />
      <div className="mind-node-head">
        <span className="mind-node-badge">아이디어</span>
        <span className="mind-node-meta">하위 {Number(data.childCount ?? 0)}개</span>
      </div>

      {typeof data.groupLabel === 'string' && (
        <div className="mind-node-group" style={{ color: String(data.groupColor ?? '#2c6ea8') }}>
          묶음: {data.groupLabel}
        </div>
      )}

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
          rows={3}
        />
      ) : (
        <p className="mind-node-text">{String(data.text ?? '')}</p>
      )}

      {selected && (
        <div className="mind-node-toolbar">
          <button type="button" onClick={() => addChildNode(id)}>
            하위 추가
          </button>
          <button type="button" onClick={() => setEditingNodeId(id)}>
            수정
          </button>
          <button type="button" onClick={() => toggleCollapsed(id)}>
            {Boolean(data.collapsed) ? '펼치기' : '접기'}
          </button>
          <button type="button" onClick={() => deleteNode(id)} disabled={Boolean(data.isRoot)}>
            삭제
          </button>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className={`mind-handle ${data.showHandles ? '' : 'mind-handle-hidden'}`}
      />
    </div>
  );
}

export default memo(MindMapNodeCard);
