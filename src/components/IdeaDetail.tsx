import { useMemo, useState } from 'react';
import type { Folder, Idea, NodeMap } from '../types';

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ACCEPTED_FILE_EXTENSIONS = '.jpg,.jpeg,.png,.pdf';

type IdeaDetailProps = {
  idea: Idea;
  folders: Folder[];
  nodes: NodeMap;
  onBack: () => void;
  onDelete: (id: string) => void;
  onUpdateIdea: (id: string, patch: Partial<Idea>) => void;
  onLocateSourceNode: (sourceNodeId: string) => void;
};

export default function IdeaDetail({
  idea,
  folders,
  nodes,
  onBack,
  onDelete,
  onUpdateIdea,
  onLocateSourceNode
}: IdeaDetailProps) {
  const [referenceLink, setReferenceLink] = useState('');
  const relatedNodes = useMemo(() => {
    const keywords = new Set([idea.title, ...idea.tags].map((item) => item.toLowerCase()));

    return Object.values(nodes)
      .filter((node) => node.id !== idea.sourceNodeId)
      .filter((node) => {
        const text = node.text.toLowerCase();
        return Array.from(keywords).some((keyword) => keyword && text.includes(keyword));
      })
      .slice(0, 6);
  }, [idea.sourceNodeId, idea.tags, idea.title, nodes]);

  const handleUpload = async (file: File, field: 'referenceImages' | 'sketchImages') => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      window.alert('jpg, jpeg, png, pdf 파일만 첨부할 수 있습니다.');
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    onUpdateIdea(idea.id, {
      [field]: [...idea[field], dataUrl]
    } as Partial<Idea>);
  };

  return (
    <section className="idea-detail">
      <div className="detail-topbar">
        <button type="button" className="detail-back-button" onClick={onBack} aria-label="이전으로">
          ←
        </button>
      </div>

      <div className="idea-detail-grid">
        <div className="detail-main-card">
          <div className="idea-title-display">{idea.title}</div>

          <div className="detail-field">
            <p className="eyebrow">폴더</p>
            <div className="detail-static-box">
              {folders.find((folder) => folder.id === idea.folderId)?.name ?? '폴더 없음'}
            </div>
          </div>

          <div className="detail-field">
            <p className="eyebrow">아이디어 메모</p>
            <textarea
              className="detail-textarea"
              value={idea.description ?? ''}
              onChange={(event) => onUpdateIdea(idea.id, { description: event.target.value })}
              placeholder="아이디어를 더 구체적으로 적어보세요."
              rows={8}
            />
          </div>

          <div className="detail-field">
            <p className="eyebrow">레퍼런스 영역</p>
            <div className="detail-inline-row">
              <input
                value={referenceLink}
                onChange={(event) => setReferenceLink(event.target.value)}
                placeholder="링크 추가"
              />
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const value = referenceLink.trim();
                  if (!value) {
                    return;
                  }
                  onUpdateIdea(idea.id, {
                    referenceLinks: [...idea.referenceLinks, normalizeUrl(value)]
                  });
                  setReferenceLink('');
                }}
              >
                링크 저장
              </button>
            </div>
            <label className="secondary-button upload-button upload-button-compact">
              이미지 업로드
              <input
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUpload(file, 'referenceImages');
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <div className="asset-grid">
              {idea.referenceLinks.length === 0 && idea.referenceImages.length === 0 && (
                <div className="detail-static-box">추가된 레퍼런스가 없습니다.</div>
              )}
              {idea.referenceLinks.map((link, index) => (
                <div key={link} className="asset-item">
                  <button
                    type="button"
                    className="asset-remove-button"
                    onClick={() =>
                      onUpdateIdea(idea.id, {
                        referenceLinks: idea.referenceLinks.filter((_, linkIndex) => linkIndex !== index)
                      })
                    }
                    aria-label="링크 삭제"
                  >
                    ×
                  </button>
                  <a href={link} target="_blank" rel="noreferrer" className="asset-link">
                    {link}
                  </a>
                </div>
              ))}
              {idea.referenceImages.map((file, index) => (
                <AssetPreview
                  key={index}
                  file={file}
                  label="reference"
                  onRemove={() =>
                    onUpdateIdea(idea.id, {
                      referenceImages: idea.referenceImages.filter((_, fileIndex) => fileIndex !== index)
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="detail-field">
            <p className="eyebrow">스케치 영역</p>
            <label className="secondary-button upload-button upload-button-compact">
              스케치 이미지 업로드
              <input
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUpload(file, 'sketchImages');
                  }
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <div className="asset-grid">
              {idea.sketchImages.length === 0 && (
                <div className="detail-static-box">추가된 스케치가 없습니다.</div>
              )}
              {idea.sketchImages.map((file, index) => (
                <AssetPreview
                  key={index}
                  file={file}
                  label="sketch"
                  onRemove={() =>
                    onUpdateIdea(idea.id, {
                      sketchImages: idea.sketchImages.filter((_, fileIndex) => fileIndex !== index)
                    })
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="detail-side-card">
          <p className="eyebrow">AI 정리 기능</p>
          <h3>관련 아이디어 노드 추천</h3>
          <div className="related-node-list">
            {relatedNodes.length > 0 ? (
              relatedNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  className="related-node-item"
                  onClick={() => onLocateSourceNode(node.id)}
                >
                  {node.text}
                </button>
              ))
            ) : (
              <p className="panel-hint">현재 아이디어와 바로 연결되는 노드 추천이 아직 없습니다.</p>
            )}
          </div>

          {idea.sourceNodeId && (
            <button
              type="button"
              className="primary-button"
              onClick={() => onLocateSourceNode(idea.sourceNodeId!)}
            >
              원본 노드 보기
            </button>
          )}

          <button
            type="button"
            className="delete-button"
            onClick={() => {
              if (window.confirm('진짜 삭제하겠습니까?')) {
                onDelete(idea.id);
              }
            }}
          >
            아이디어 삭제
          </button>
        </aside>
      </div>
    </section>
  );
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const normalizeUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
};

function AssetPreview({
  file,
  label,
  onRemove
}: {
  file: string;
  label: string;
  onRemove: () => void;
}) {
  if (file.startsWith('data:application/pdf')) {
    return (
      <div className="asset-item">
        <button type="button" className="asset-remove-button" onClick={onRemove} aria-label="첨부 삭제">
          ×
        </button>
        <a href={file} target="_blank" rel="noreferrer" className="asset-file">
          {label === 'reference' ? '레퍼런스 PDF 열기' : '스케치 PDF 열기'}
        </a>
      </div>
    );
  }

  return (
    <div className="asset-item">
      <button type="button" className="asset-remove-button" onClick={onRemove} aria-label="첨부 삭제">
        ×
      </button>
      <img src={file} alt={label} className="asset-image" />
    </div>
  );
}
